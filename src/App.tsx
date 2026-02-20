import { minni } from "@bigmistqke/minni";
import { makePersisted } from "@solid-primitives/storage";
import { useNavigate, useParams } from "@solidjs/router";
import clsx from "clsx";
import {
  createEffect,
  createResource,
  createSignal,
  For,
  on,
  onCleanup,
  Show,
  type Component,
} from "solid-js";
import { createStore } from "solid-js/store";
import styles from "./App.module.css";
import { GraphEdge } from "./components/GraphEdge";
import { GraphNode } from "./components/GraphNode";
import { GraphNodeContent } from "./components/GraphNodeContent";
import { GraphTemporaryEdge } from "./components/GraphTemporaryEdge";
import {
  calcNodeHeight,
  CONTENT_PADDING_BLOCK,
  CONTENT_PADDING_INLINE,
  ELEMENT_HEIGHT,
  GAP,
  GRID,
  HEADING_PADDING_BLOCK,
  HEADING_PADDING_INLINE,
  PORT_INSET,
  PORT_RADIUS,
  PORT_SPACING,
  snapToGrid,
  TITLE_HEIGHT,
} from "./constants";
import { GraphContext, type TemporaryEdge } from "./context";
import type { ConstructProps, GraphConfig } from "./lib/create-graph";
import { createGraph } from "./lib/create-graph";
import envelopeProcessorUrl from "./lib/envelope-processor?url";
import sequencerProcessorUrl from "./lib/sequencer-processor?url";
import {
  createWorkletFileSystem,
  getSourceBoilerplate,
  getWorkletEntry,
} from "./lib/worklet-file-system";
import { Button } from "./ui/Button";
import { HorizontalSlider } from "./ui/HorizontalSlider";
import { Select } from "./ui/Select";

const audioCtx = new AudioContext();
const promise = Promise.all([
  audioCtx.audioWorklet.addModule(envelopeProcessorUrl),
  audioCtx.audioWorklet.addModule(sequencerProcessorUrl),
]);

function GraphEditor(props: { graphName: string }) {
  const navigate = useNavigate();
  const workletFS = createWorkletFileSystem();
  const [selectedType, setSelectedType] = createSignal<string | undefined>();

  // Persisted custom type definitions (global, shared across graphs)
  const [savedTypes, setSavedTypes] = makePersisted(
    createStore<Record<string, { displayName: string; code: string }>>({}),
    { name: "audiograph-custom-types" },
  );

  function saveAsNewType(code: string, nodeId: string) {
    const name = prompt("Name for this node type:");
    if (!name?.trim()) return;
    const typeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    setSavedTypes(typeName, { displayName: name.trim(), code });
    setConfig(typeName, {
      title: name.trim(),
      dimensions: { x: 280, y: calcNodeHeight(1, 7) },
      resizable: true,
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { name: "", code },
      construct: createWorkletConstruct(typeName),
    });
    graph.updateNode(nodeId, { type: typeName });
  }

  function createWorkletConstruct(typeKey: string) {
    const isSaved = typeKey !== "audioworklet";

    return (props: ConstructProps<{ name: string; code: string }>) => {
      const inputGain = audioCtx.createGain();
      const outputGain = audioCtx.createGain();
      const [workletNode, setWorkletNode] =
        createSignal<AudioWorkletNode | null>(null);

      let currentWorkletNode: AudioWorkletNode | null = null;
      let loadGeneration = 0;

      createEffect(() => {
        const name = props.state.name;
        if (!name) return;

        const url = workletFS.fileUrls.get(`/${name}/worklet.js`);
        const processorName = workletFS.getProcessorName(name);
        if (!url) return;

        const gen = ++loadGeneration;

        if (currentWorkletNode) {
          inputGain.disconnect(currentWorkletNode);
          currentWorkletNode.disconnect(outputGain);
          currentWorkletNode = null;
        }

        audioCtx.audioWorklet
          .addModule(url)
          .then(() => {
            if (loadGeneration !== gen) return;
            const node = new AudioWorkletNode(audioCtx, processorName);
            currentWorkletNode = node;
            inputGain.connect(node);
            node.connect(outputGain);
            setWorkletNode(node);
          })
          .catch((err) => {
            console.error(`Failed to load worklet "${processorName}":`, err);
          });
      });

      onCleanup(() => {
        if (currentWorkletNode) {
          inputGain.disconnect(currentWorkletNode);
          currentWorkletNode.disconnect(outputGain);
        }
        inputGain.disconnect();
        outputGain.disconnect();
      });

      if (isSaved) {
        createEffect(
          on(
            () => config[typeKey]?.state?.code as string | undefined,
            (savedCode) => {
              if (!savedCode || !props.state.name) return;
              props.setState("code", savedCode);
              workletFS.writeFile(`/${props.state.name}/source.js`, savedCode);
            },
            { defer: true },
          ),
        );
      }

      const params = () => {
        const node = workletNode();
        if (!node) return [];
        return Array.from(node.parameters.entries());
      };

      return {
        in: { audio: inputGain },
        out: { audio: outputGain },
        ui: () => (
          <GraphNodeContent
            style={{
              display: "flex",
              "flex-direction": "column",
              gap: "var(--gap)",
            }}
          >
            <For each={params()}>
              {([name, param]) => {
                const min = param.minValue < -1e30 ? 0 : param.minValue;
                const max = param.maxValue > 1e30 ? 1 : param.maxValue;
                const [value, setValue] = createSignal(param.defaultValue);
                return (
                  <HorizontalSlider
                    title={name}
                    output={value().toFixed(2)}
                    value={value()}
                    min={min}
                    max={max}
                    step={(max - min) / 1000}
                    onInput={(value) => {
                      setValue(value);
                      param.value = value;
                    }}
                  />
                );
              }}
            </For>
            <textarea
              style={{
                flex: 1,
                width: "100%",
                "font-family": "monospace",
                "font-size": "9px",
                resize: "none",
                border: "1px solid #ccc",
                "box-sizing": "border-box",
                "tab-size": "2",
              }}
              spellcheck={false}
              value={props.state.code}
              onInput={(e) => {
                const newCode = e.currentTarget.value;
                props.setState("code", newCode);
                workletFS.writeFile(`/${props.state.name}/source.js`, newCode);
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "var(--gap)",
              }}
            >
              {isSaved && (
                <Button
                  style={{
                    flex: 1,
                    padding: "2px 4px",
                    "font-size": "10px",
                    cursor: "pointer",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setSavedTypes(typeKey, "code", props.state.code);
                    setConfig(typeKey, "state", "code", props.state.code);
                  }}
                >
                  Save
                </Button>
              )}
              <Button
                style={{
                  flex: 1,
                  padding: "2px 4px",
                  "font-size": "10px",
                  cursor: "pointer",
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => saveAsNewType(props.state.code, props.id)}
              >
                {isSaved ? "Save as" : "Save as Type"}
              </Button>
            </div>
          </GraphNodeContent>
        ),
      };
    };
  }

  const [config, setConfig] = createStore<GraphConfig>({
    oscillator: {
      title: "oscillator",
      dimensions: { x: 180, y: calcNodeHeight(1, 2, true) },
      ports: {
        in: [{ name: "frequency", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { frequency: 440, type: "sine" as OscillatorType },
      construct(props) {
        const osc = audioCtx.createOscillator();
        osc.start();

        createEffect(() => {
          osc.frequency.value = props.state.frequency;
        });
        createEffect(() => {
          osc.type = props.state.type;
        });

        onCleanup(() => osc.stop());

        return {
          in: { frequency: osc.frequency, detune: osc.detune },
          out: { audio: osc },
          ui: () => (
            <GraphNodeContent
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "var(--gap)",
              }}
            >
              <Select
                title="kind"
                value={props.state.type}
                options={["sine", "square", "sawtooth", "triangle"] as const}
                onChange={(value) => props.setState("type", value)}
              />
              <HorizontalSlider
                title="frequency"
                value={props.state.frequency}
                output={`${Math.round(props.state.frequency)}Hz`}
                disabled={props.isInputConnected("frequency")}
                onInput={(value) => props.setState("frequency", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    gain: {
      title: "gain",
      dimensions: { x: 180, y: calcNodeHeight(2, 1) },
      ports: {
        in: [{ name: "audio" }, { name: "gain", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { gain: 0.5 },
      construct(props) {
        const gainNode = audioCtx.createGain();

        createEffect(() => {
          gainNode.gain.value = props.state.gain;
        });

        return {
          in: { audio: gainNode, gain: gainNode.gain },
          out: { audio: gainNode },
          ui: () => (
            <GraphNodeContent>
              <HorizontalSlider
                title="gain"
                output={props.state.gain.toFixed(2)}
                value={props.state.gain}
                min={0}
                max={1}
                step={0.001}
                disabled={props.isInputConnected("gain")}
                onInput={(value) => props.setState("gain", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    constant: {
      title: "constant",
      dimensions: { x: 180, y: calcNodeHeight(1, 1) },
      ports: {
        in: [],
        out: [{ name: "value", kind: "param" }],
      },
      state: { value: 440 },
      construct(props) {
        const src = audioCtx.createConstantSource();
        src.start();

        createEffect(() => {
          src.offset.value = props.state.value;
        });

        onCleanup(() => src.stop());

        return {
          in: {},
          out: { value: src },
          ui: () => (
            <GraphNodeContent>
              <HorizontalSlider
                title="value"
                output={props.state.value}
                value={props.state.value}
                onInput={(value) => props.setState("value", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    scale: {
      title: "scale",
      dimensions: { x: 180, y: calcNodeHeight(1, 1) },
      ports: {
        in: [{ name: "signal", kind: "param" }],
        out: [{ name: "scaled", kind: "param" }],
      },
      state: { factor: 1000 },
      construct(props) {
        const gain = audioCtx.createGain();

        createEffect(() => {
          gain.gain.value = props.state.factor;
        });

        return {
          in: { signal: gain },
          out: { scaled: gain },
          ui: () => (
            <GraphNodeContent>
              <HorizontalSlider
                title="factor"
                value={props.state.factor}
                output={props.state.factor.toFixed(0)}
                min={-10000}
                max={10000}
                step={1}
                onInput={(value) => props.setState("factor", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    range: {
      title: "range",
      dimensions: { x: 180, y: calcNodeHeight(1, 2) },
      ports: {
        in: [{ name: "signal", kind: "param" }],
        out: [{ name: "mapped", kind: "param" }],
      },
      state: { min: 200, max: 2000 },
      construct(props) {
        const scaleGain = audioCtx.createGain();
        const offset = audioCtx.createConstantSource();
        offset.start();
        scaleGain.connect(offset.offset);

        createEffect(() => {
          scaleGain.gain.value = props.state.max - props.state.min;
          offset.offset.value = props.state.min;
        });

        onCleanup(() => offset.stop());

        return {
          in: { signal: scaleGain },
          out: { mapped: offset },
          ui: () => (
            <GraphNodeContent
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "var(--gap)",
              }}
            >
              <HorizontalSlider
                title="min"
                value={props.state.min}
                output={props.state.min.toFixed(0)}
                min={0}
                max={10000}
                step={1}
                onInput={(value) => props.setState("min", value)}
              />
              <HorizontalSlider
                title="max"
                value={props.state.max}
                output={props.state.max.toFixed(0)}
                min={0}
                max={10000}
                step={1}
                onInput={(value) => props.setState("max", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    filter: {
      title: "filter",
      dimensions: { x: 180, y: calcNodeHeight(3, 2) },
      ports: {
        in: [
          { name: "audio" },
          { name: "frequency", kind: "param" },
          { name: "Q", kind: "param" },
        ],
        out: [{ name: "audio" }],
      },
      state: { frequency: 1000, Q: 1 },
      construct(props) {
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";

        createEffect(() => {
          filter.frequency.value = props.state.frequency;
        });
        createEffect(() => {
          filter.Q.value = props.state.Q;
        });

        return {
          in: { audio: filter, frequency: filter.frequency, Q: filter.Q },
          out: { audio: filter },
          ui: () => (
            <GraphNodeContent
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "var(--gap)",
              }}
            >
              <HorizontalSlider
                title="freq"
                value={props.state.frequency}
                output={`${Math.round(props.state.frequency)}Hz`}
                min={20}
                max={20000}
                step={1}
                disabled={props.isInputConnected("frequency")}
                onInput={(value) => props.setState("frequency", value)}
              />
              <HorizontalSlider
                title="q"
                value={props.state.Q}
                output={props.state.Q.toFixed(1)}
                min={0.1}
                max={20}
                step={0.1}
                disabled={props.isInputConnected("Q")}
                onInput={(value) => props.setState("Q", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    delay: {
      title: "delay",
      dimensions: { x: 180, y: calcNodeHeight(2, 1) },
      ports: {
        in: [{ name: "audio" }, { name: "delayTime", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { delayTime: 0.3 },
      construct(props) {
        const delay = audioCtx.createDelay(1);

        createEffect(() => {
          delay.delayTime.value = props.state.delayTime;
        });

        return {
          in: { audio: delay, delayTime: delay.delayTime },
          out: { audio: delay },
          ui: () => (
            <GraphNodeContent>
              <HorizontalSlider
                title="time"
                value={props.state.delayTime}
                output={`${props.state.delayTime.toFixed(2)}s`}
                min={0}
                max={1}
                step={0.01}
                disabled={props.isInputConnected("delayTime")}
                onInput={(value) => props.setState("delayTime", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    panner: {
      title: "panner",
      dimensions: { x: 180, y: calcNodeHeight(2, 1) },
      ports: {
        in: [{ name: "audio" }, { name: "pan", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { pan: 0 },
      construct(props) {
        const panner = audioCtx.createStereoPanner();

        createEffect(() => {
          panner.pan.value = props.state.pan;
        });

        return {
          in: { audio: panner, pan: panner.pan },
          out: { audio: panner },
          ui: () => (
            <GraphNodeContent>
              <HorizontalSlider
                title="pan"
                value={props.state.pan}
                output={props.state.pan.toFixed(2)}
                min={-1}
                max={1}
                step={0.01}
                disabled={props.isInputConnected("pan")}
                onInput={(value) => props.setState("pan", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    compressor: {
      title: "compressor",
      dimensions: { x: 180, y: calcNodeHeight(1, 4) },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { threshold: -24, ratio: 12, attack: 0.003, release: 0.25 },
      construct(props) {
        const comp = audioCtx.createDynamicsCompressor();

        createEffect(() => {
          comp.threshold.value = props.state.threshold;
        });
        createEffect(() => {
          comp.ratio.value = props.state.ratio;
        });
        createEffect(() => {
          comp.attack.value = props.state.attack;
        });
        createEffect(() => {
          comp.release.value = props.state.release;
        });

        return {
          in: { audio: comp },
          out: { audio: comp },
          ui: () => (
            <GraphNodeContent
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "var(--gap)",
              }}
            >
              <HorizontalSlider
                title="threshold"
                value={props.state.threshold}
                output={`${props.state.threshold}dB`}
                min={-100}
                max={0}
                step={1}
                onInput={(v) => props.setState("threshold", v)}
              />
              <HorizontalSlider
                title="ratio"
                value={props.state.ratio}
                output={`${props.state.ratio}:1`}
                min={1}
                max={20}
                step={0.1}
                onInput={(v) => props.setState("ratio", v)}
              />
              <HorizontalSlider
                title="attack"
                value={props.state.attack}
                output={`${props.state.attack.toFixed(3)}s`}
                min={0}
                max={1}
                step={0.001}
                onInput={(v) => props.setState("attack", v)}
              />
              <HorizontalSlider
                title="release"
                value={props.state.release}
                output={`${props.state.release.toFixed(2)}s`}
                min={0}
                max={1}
                step={0.01}
                onInput={(v) => props.setState("release", v)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    reverb: {
      title: "reverb",
      dimensions: { x: 180, y: calcNodeHeight(1, 2) },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { decay: 2, mix: 0.5 },
      construct(props) {
        const convolver = audioCtx.createConvolver();
        const dry = audioCtx.createGain();
        const wet = audioCtx.createGain();
        const input = audioCtx.createGain();
        const output = audioCtx.createGain();

        function generateImpulse(decay: number) {
          const length = audioCtx.sampleRate * decay;
          const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
          for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
              data[i] =
                (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
          }
          return impulse;
        }

        convolver.buffer = generateImpulse(props.state.decay);

        input.connect(dry);
        input.connect(convolver);
        convolver.connect(wet);
        dry.connect(output);
        wet.connect(output);

        createEffect(() => {
          convolver.buffer = generateImpulse(props.state.decay);
        });
        createEffect(() => {
          wet.gain.value = props.state.mix;
          dry.gain.value = 1 - props.state.mix;
        });

        onCleanup(() => {
          input.disconnect();
          convolver.disconnect();
          dry.disconnect();
          wet.disconnect();
        });

        return {
          in: { audio: input },
          out: { audio: output },
          ui: () => (
            <GraphNodeContent
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "var(--gap)",
              }}
            >
              <HorizontalSlider
                title="decay"
                value={props.state.decay}
                output={`${props.state.decay.toFixed(1)}s`}
                min={0.1}
                max={10}
                step={0.1}
                disabled={props.isInputConnected("decay")}
                onInput={(value) => props.setState("decay", value)}
              />
              <HorizontalSlider
                title="mix"
                value={props.state.mix}
                output={`${Math.round(props.state.mix * 100)}%`}
                min={0}
                max={1}
                step={0.01}
                onInput={(value) => props.setState("mix", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    waveshaper: {
      title: "waveshaper",
      dimensions: { x: 180, y: calcNodeHeight(1, 1) },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { amount: 50, oversample: "4x" as OverSampleType },
      construct(props) {
        const shaper = audioCtx.createWaveShaper();

        function makeDistortionCurve(amount: number) {
          const k = amount;
          const samples = 44100;
          const curve = new Float32Array(samples);
          const deg = Math.PI / 180;
          for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
          }
          return curve;
        }

        shaper.curve = makeDistortionCurve(props.state.amount);
        shaper.oversample = props.state.oversample;

        createEffect(() => {
          shaper.curve = makeDistortionCurve(props.state.amount);
        });
        createEffect(() => {
          shaper.oversample = props.state.oversample;
        });

        return {
          in: { audio: shaper },
          out: { audio: shaper },
          ui: () => (
            <GraphNodeContent
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "var(--gap)",
              }}
            >
              <HorizontalSlider
                title="drive"
                value={props.state.amount}
                output={`${Math.round(props.state.amount)}%`}
                min={0}
                max={100}
                step={1}
                disabled={props.isInputConnected("amount")}
                onInput={(value) => props.setState("amount", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    analyser: {
      title: "analyser",
      dimensions: { x: 200, y: calcNodeHeight(1, 3) },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      construct() {
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;

        return {
          in: { audio: analyser },
          out: { audio: analyser },
          ui: () => (
            <canvas
              ref={(canvas) => {
                const canvasCtx = canvas.getContext("2d")!;
                let animId: number;
                const draw = () => {
                  const w = canvas.width;
                  const h = canvas.height;
                  canvasCtx.fillStyle = "#1a1a2e";
                  canvasCtx.fillRect(0, 0, w, h);
                  const dataArray = new Uint8Array(analyser.frequencyBinCount);
                  analyser.getByteTimeDomainData(dataArray);
                  canvasCtx.lineWidth = 1.5;
                  canvasCtx.strokeStyle = "#4a9eff";
                  canvasCtx.beginPath();
                  const sliceWidth = w / dataArray.length;
                  let x = 0;
                  for (let i = 0; i < dataArray.length; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = (v * h) / 2;
                    if (i === 0) canvasCtx.moveTo(x, y);
                    else canvasCtx.lineTo(x, y);
                    x += sliceWidth;
                  }
                  canvasCtx.lineTo(w, h / 2);
                  canvasCtx.stroke();
                  animId = requestAnimationFrame(draw);
                };
                draw();
                onCleanup(() => cancelAnimationFrame(animId));
              }}
              width={170}
              height={80}
              style={{
                width: "100%",
                height: "100%",
                "border-radius": "2px",
              }}
            />
          ),
        };
      },
    },
    meter: {
      hideLabels: true,
      dimensions: { x: 30, y: calcNodeHeight(1, 3) },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      construct() {
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        const [level, setLevel] = createSignal(0);
        let animId: number;
        const poll = () => {
          const data = new Float32Array(analyser.fftSize);
          analyser.getFloatTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
          setLevel(Math.sqrt(sum / data.length));
          animId = requestAnimationFrame(poll);
        };
        poll();
        onCleanup(() => cancelAnimationFrame(animId));

        return {
          in: { audio: analyser },
          out: { audio: analyser },
          ui: () => (
            <div
              style={{
                display: "grid",
                height: "100%",
                "align-items": "end",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "100%",
                  background: "#ddd",
                  overflow: "hidden",
                  display: "grid",
                  "align-items": "end",
                }}
              >
                <div
                  style={{
                    height: `${Math.min(level() * 100, 100)}%`,
                    background:
                      level() > 0.8
                        ? "#ff6b6b"
                        : level() > 0.5
                          ? "#ffd43b"
                          : "#51cf66",
                    transition: "height 50ms",
                  }}
                />
              </div>
            </div>
          ),
        };
      },
    },
    debug: {
      title: "debug",
      dimensions: { x: 180, y: calcNodeHeight(1, 1) },
      ports: {
        in: [{ name: "signal", kind: "param" }],
        out: [],
      },
      construct() {
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        const [value, setValue] = createSignal(0);
        let animId: number;
        const poll = () => {
          const data = new Float32Array(analyser.fftSize);
          analyser.getFloatTimeDomainData(data);
          setValue(data[0]);
          animId = requestAnimationFrame(poll);
        };
        poll();
        onCleanup(() => cancelAnimationFrame(animId));

        return {
          in: { signal: analyser },
          out: {},
          ui: () => (
            <div
              style={{
                "font-family": "monospace",
                "font-size": "14px",
                color: "var(--color-text)",
                "text-align": "center",
                "line-height": "2",
              }}
            >
              {value().toFixed(4)}
            </div>
          ),
        };
      },
    },
    noise: {
      title: "noise",
      dimensions: { x: 120, y: calcNodeHeight(1, 0) },
      ports: {
        in: [],
        out: [{ name: "audio" }],
      },
      construct() {
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(
          1,
          bufferSize,
          audioCtx.sampleRate,
        );
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        noise.start();

        onCleanup(() => noise.stop());

        return {
          in: {},
          out: { audio: noise },
        };
      },
    },
    lfo: {
      title: "lfo",
      dimensions: { x: 180, y: calcNodeHeight(1, 2) },
      ports: {
        in: [],
        out: [{ name: "modulation", kind: "param" }],
      },
      state: { rate: 2, depth: 0.5, type: "sine" as OscillatorType },
      construct(props) {
        const osc = audioCtx.createOscillator();
        const depthGain = audioCtx.createGain();
        osc.connect(depthGain);
        osc.start();

        createEffect(() => {
          osc.frequency.value = props.state.rate;
        });
        createEffect(() => {
          osc.type = props.state.type;
        });
        createEffect(() => {
          depthGain.gain.value = props.state.depth;
        });

        onCleanup(() => osc.stop());

        return {
          in: {},
          out: { modulation: depthGain },
          ui: () => (
            <GraphNodeContent
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "var(--gap)",
              }}
            >
              <HorizontalSlider
                title="rate"
                value={props.state.rate}
                output={`${props.state.rate.toFixed(1)}Hz`}
                min={0.01}
                max={20}
                step={0.01}
                onInput={(value) => props.setState("rate", value)}
              />
              <HorizontalSlider
                title="depth"
                value={props.state.depth}
                output={props.state.depth.toFixed(2)}
                min={0}
                max={1}
                step={0.01}
                onInput={(value) => props.setState("depth", value)}
              />
            </GraphNodeContent>
          ),
        };
      },
    },
    envelope: {
      title: "envelope",
      dimensions: { x: 180, y: calcNodeHeight(1, 5) },
      ports: {
        in: [{ name: "gate", kind: "param" }],
        out: [{ name: "envelope", kind: "param" }],
      },
      state: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 },
      construct(props) {
        const node = new AudioWorkletNode(audioCtx, "envelope-processor", {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
        });

        const sendParams = () =>
          node.port.postMessage({
            type: "params",
            attack: props.state.attack,
            decay: props.state.decay,
            sustain: props.state.sustain,
            release: props.state.release,
          });

        sendParams();
        createEffect(sendParams);

        const trigger = () => node.port.postMessage({ type: "trigger" });

        onCleanup(() => node.disconnect());

        return {
          in: { gate: node },
          out: { envelope: node },
          ui: () => (
            <GraphNodeContent
              style={{
                display: "flex",
                "flex-direction": "column",
              }}
            >
              <HorizontalSlider
                title="attack"
                value={props.state.attack}
                output={`${props.state.attack.toFixed(2)}s`}
                min={0.001}
                max={2}
                step={0.001}
                onInput={(value) => props.setState("attack", value)}
              />
              <HorizontalSlider
                title="decay"
                value={props.state.decay}
                output={`${props.state.decay.toFixed(2)}s`}
                min={0.001}
                max={2}
                step={0.001}
                onInput={(value) => props.setState("decay", value)}
              />
              <HorizontalSlider
                title="sustain"
                value={props.state.sustain}
                output={props.state.sustain.toFixed(2)}
                min={0}
                max={1}
                step={0.01}
                onInput={(value) => props.setState("sustain", value)}
              />
              <HorizontalSlider
                title="release"
                value={props.state.release}
                output={`${props.state.release.toFixed(2)}s`}
                min={0.001}
                max={5}
                step={0.001}
                onInput={(value) => props.setState("release", value)}
              />
              <Button
                style={{
                  padding: "2px 4px",
                  "font-size": "10px",
                  cursor: "pointer",
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => trigger()}
              >
                Trigger
              </Button>
            </GraphNodeContent>
          ),
        };
      },
    },
    sequencer: {
      title: "sequencer",
      dimensions: { x: 280, y: calcNodeHeight(1, 3) },
      resizable: true,
      ports: {
        in: [],
        out: [{ name: "gate", kind: "param" }],
      },
      state: {
        bpm: 120,
        steps: [
          true,
          false,
          false,
          false,
          true,
          false,
          false,
          false,
          true,
          false,
          false,
          false,
          true,
          false,
          false,
          false,
        ],
      },
      construct(props) {
        const node = new AudioWorkletNode(audioCtx, "sequencer-processor", {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [1],
        });

        // Sync initial state
        node.port.postMessage({
          type: "bpm",
          value: props.state.bpm,
        });
        node.port.postMessage({
          type: "steps",
          value: props.state.steps.map((s: boolean) => (s ? 1 : 0)),
        });

        const [currentStep, setCurrentStep] = createSignal(-1);

        // Listen for step updates from worklet
        node.port.onmessage = (e: MessageEvent) => {
          if (e.data.type === "step") setCurrentStep(e.data.value);
        };

        // Sync BPM changes to worklet
        createEffect(() => {
          node.port.postMessage({ type: "bpm", value: props.state.bpm });
        });

        // Sync step pattern changes to worklet
        createEffect(() => {
          node.port.postMessage({
            type: "steps",
            value: props.state.steps.map((s: boolean) => (s ? 1 : 0)),
          });
        });

        const start = () => node.port.postMessage({ type: "start" });
        const stop = () => node.port.postMessage({ type: "stop" });

        onCleanup(() => node.disconnect());

        return {
          in: {},
          out: { gate: node },
          ui: () => {
            const stepCount = () => props.state.steps.length;
            return (
              <GraphNodeContent
                style={{
                  display: "grid",
                  "grid-template-rows": "auto 1fr auto",
                }}
              >
                <HorizontalSlider
                  title="bpm"
                  value={props.state.bpm}
                  output={`${Math.round(props.state.bpm)}`}
                  min={20}
                  max={300}
                  step={1}
                  onInput={(value) => props.setState("bpm", value)}
                />
                <div
                  style={{
                    display: "grid",
                    "grid-template-columns": `repeat(${stepCount()}, 1fr)`,
                    gap: "1px",
                  }}
                >
                  <For each={props.state.steps}>
                    {(active, i) => (
                      <div
                        style={{
                          background: active
                            ? currentStep() === i()
                              ? "#4a9eff"
                              : "#555"
                            : currentStep() === i()
                              ? "#4a9eff33"
                              : "#ddd",
                          cursor: "pointer",
                          "min-height": "16px",
                          "border-radius": "2px",
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() =>
                          props.setState(
                            "steps",
                            i(),
                            !props.state.steps[i()],
                          )
                        }
                      />
                    )}
                  </For>
                </div>
                <div
                  style={{
                    display: "grid",
                    "grid-template-columns": "1fr 1fr",
                    gap: "var(--gap)",
                  }}
                >
                  <Button
                    style={{
                      padding: "2px 4px",
                      "font-size": "10px",
                      cursor: "pointer",
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={start}
                  >
                    Play
                  </Button>
                  <Button
                    style={{
                      padding: "2px 4px",
                      "font-size": "10px",
                      cursor: "pointer",
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={stop}
                  >
                    Stop
                  </Button>
                </div>
              </GraphNodeContent>
            );
          },
        };
      },
    },
    destination: {
      title: "output",
      dimensions: { x: 120, y: calcNodeHeight(1, 0) },
      ports: {
        in: [{ name: "audio" }],
        out: [],
      },
      construct() {
        return {
          in: { audio: audioCtx.destination },
        };
      },
    },
    audioworklet: {
      title: "audioworklet",
      dimensions: { x: 280, y: calcNodeHeight(1, 7) },
      resizable: true,
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { name: "", code: "" },
      construct: createWorkletConstruct("audioworklet"),
    },
  });

  // Reconstruct saved custom types from persistence
  for (const key of Object.keys(savedTypes)) {
    const data = savedTypes[key];
    if (data && !config[key]) {
      setConfig(key, {
        title: data.displayName,
        dimensions: { x: 280, y: calcNodeHeight(1, 7) },
        resizable: true,
        ports: {
          in: [{ name: "audio" }],
          out: [{ name: "audio" }],
        },
        state: { name: "", code: data.code },
        construct: createWorkletConstruct(key),
      });
    }
  }

  const graph = createGraph(config, {
    persistName: `audiograph-${props.graphName}`,
  });

  // Initialize worklet files for persisted custom nodes
  for (const node of graph.graph.nodes) {
    const entry = graph.nodeStates.get(node.id);
    if (entry?.state?.name && entry?.state?.code) {
      const name = entry.state.name;
      if (!workletFS.readFile(`/${name}/source.js`)) {
        workletFS.writeFile(`/${name}/source.js`, entry.state.code);
        workletFS.writeFile(`/${name}/worklet.js`, getWorkletEntry(name));
      }
    }
  }

  // --- UI State ---

  const [store, setStore] = createStore<{
    origin: { x: number; y: number };
    dimensions: { width: number; height: number };
    temporaryEdge: TemporaryEdge | undefined;
    dragging: boolean;
    cursorPosition: { x: number; y: number } | undefined;
  }>({
    origin: { x: 0, y: 0 },
    dimensions: { width: 0, height: 0 },
    temporaryEdge: undefined,
    dragging: false,
    cursorPosition: undefined,
  });

  return (
    <GraphContext.Provider
      value={{
        graph,
        setTemporaryEdge(edge) {
          setStore("temporaryEdge", edge);
        },
        getTemporaryEdge() {
          return store.temporaryEdge;
        },
        updateTemporaryEdge(x, y) {
          setStore("temporaryEdge", (edge) =>
            edge ? { ...edge, x, y } : edge,
          );
        },
        setDragging(dragging) {
          if (dragging) window.getSelection()?.removeAllRanges();
          setStore("dragging", dragging);
        },
        getCursorPosition() {
          return store.cursorPosition;
        },
      }}
    >
      <div class={styles.sidebar}>
        <For
          each={[
            {
              label: "Sources",
              types: ["oscillator", "constant", "noise"],
            },
            {
              label: "Effects",
              types: [
                "gain",
                "filter",
                "delay",
                "reverb",
                "compressor",
                "waveshaper",
                "panner",
              ],
            },
            {
              label: "Modulation",
              types: ["lfo", "envelope", "sequencer", "scale", "range"],
            },
            {
              label: "Analysis",
              types: ["analyser", "meter", "debug"],
            },
            { label: "Output", types: ["destination"] },
            { label: "Code", types: ["audioworklet"] },
            {
              label: "User",
              types: Object.keys(graph.config).filter(
                (k) =>
                  ![
                    "oscillator",
                    "constant",
                    "noise",
                    "gain",
                    "filter",
                    "delay",
                    "reverb",
                    "compressor",
                    "waveshaper",
                    "panner",
                    "lfo",
                    "envelope",
                    "scale",
                    "range",
                    "sequencer",
                    "analyser",
                    "meter",
                    "debug",
                    "destination",
                    "audioworklet",
                  ].includes(k),
              ),
            },
          ]}
        >
          {(category) => (
            <Show when={category.types.length > 0}>
              <span class={styles.categoryLabel}>{category.label}</span>
              <div class={styles.categoryGrid}>
                <For each={category.types}>
                  {(type) => {
                    const portColor = () => {
                      const kind =
                        (graph.config[type]?.ports?.out?.[0] as any)?.kind ||
                        "audio";
                      return `var(--color-port-${kind})`;
                    };
                    return (
                      <Button
                        class={clsx(
                          styles.button,
                          selectedType() === type && styles.selected,
                        )}
                        style={{
                          "--color-node": portColor(),
                        }}
                        onClick={() =>
                          setSelectedType((prev) =>
                            prev === type ? undefined : type,
                          )
                        }
                      >
                        {type}
                      </Button>
                    );
                  }}
                </For>
              </div>
            </Show>
          )}
        </For>
      </div>
      <div class={styles.topRight}>
        <span class={styles.graphName}>{props.graphName}</span>
        <Button
          onClick={() => {
            const name = prompt("New graph name:");
            if (name?.trim()) navigate(`/${name.trim()}`);
          }}
          class={styles.button}
        >
          new graph
        </Button>
        <Button
          onClick={() => {
            audioCtx.resume();
          }}
          class={styles.button}
        >
          resume audio
        </Button>
      </div>
      <svg
        ref={(element) => {
          new ResizeObserver(() => {
            setStore("dimensions", element.getBoundingClientRect());
          }).observe(element);
        }}
        viewBox={`${-store.origin.x} ${store.origin.y} ${store.dimensions.width} ${store.dimensions.height}`}
        class={styles.svg}
        style={{
          "--port-radius": `${PORT_RADIUS}px`,
          "--port-inset": `${PORT_INSET}px`,
          "--port-spacing": `${PORT_SPACING}px`,
          "--port-offset": `${TITLE_HEIGHT}px`,
          "--element-height": `${ELEMENT_HEIGHT}px`,
          "--gap": `${GAP}px`,
          "--title-height": `${TITLE_HEIGHT}px`,
          "--content-padding-block": `${CONTENT_PADDING_BLOCK}px`,
          "--content-padding-inline": `${CONTENT_PADDING_INLINE}px`,
          "--heading-padding-block": `${HEADING_PADDING_BLOCK}px`,
          "--heading-padding-inline": `${HEADING_PADDING_INLINE}px`,
        }}
        data-dragging={store.dragging || undefined}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setStore("cursorPosition", {
            x: event.clientX - rect.left - store.origin.x,
            y: event.clientY - rect.top + store.origin.y,
          });
        }}
        onPointerLeave={() => {
          setStore("cursorPosition", undefined);
        }}
        onPointerDown={async (event) => {
          if (event.target !== event.currentTarget) return;
          const _origin = { ...store.origin };
          const start = performance.now();

          setStore("dragging", true);
          await minni(event, (delta) => {
            setStore("origin", {
              x: _origin.x + delta.x,
              y: _origin.y + delta.y,
            });
          });
          setStore("dragging", false);

          if (performance.now() - start < 250) {
            const type = selectedType();
            if (!type) return;
            const position = {
              x: snapToGrid(event.offsetX - store.origin.x),
              y: snapToGrid(event.offsetY + store.origin.y),
            };

            const typeDef = config[type];
            if (typeDef?.state && "code" in typeDef.state) {
              const nodeId = graph.addNode(type, position);
              const name = `custom-${nodeId}`;
              const code = typeDef.state.code || getSourceBoilerplate();

              workletFS.writeFile(`/${name}/source.js`, code);
              workletFS.writeFile(`/${name}/worklet.js`, getWorkletEntry(name));

              const entry = graph.nodeStates.get(nodeId);
              if (entry) {
                entry.setState("name", name);
                entry.setState("code", code);
              }
            } else {
              graph.addNode(type, position);
            }
            setSelectedType(undefined);
          }
        }}
      >
        <defs>
          <pattern
            id="grid"
            width={GRID}
            height={GRID}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={0} cy={0} r={0.5} fill="#6e6e6e" />
          </pattern>
        </defs>
        <rect
          x={-store.origin.x}
          y={store.origin.y}
          width={store.dimensions.width}
          height={store.dimensions.height}
          fill="url(#grid)"
          pointer-events="none"
        />
        <For each={graph.graph.nodes}>
          {(node) => <GraphNode node={node} />}
        </For>
        <For each={graph.graph.edges}>{(edge) => <GraphEdge {...edge} />}</For>
        <Show when={store.temporaryEdge}>
          {(edge) => <GraphTemporaryEdge {...edge()} />}
        </Show>
      </svg>
    </GraphContext.Provider>
  );
}

const App: Component = () => {
  const [resource] = createResource(() => promise.then(() => true));
  const params = useParams<{ graphName?: string }>();
  const navigate = useNavigate();

  createEffect(() => {
    if (!params.graphName) {
      navigate("/default", { replace: true });
    }
  });

  return (
    <Show when={resource() && params.graphName} keyed>
      {(graphName) => <GraphEditor graphName={graphName} />}
    </Show>
  );
};

export default App;
