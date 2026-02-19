import { minni } from "@bigmistqke/minni";
import { ReactiveMap } from "@solid-primitives/map";
import { makePersisted } from "@solid-primitives/storage";
import { useNavigate, useParams } from "@solidjs/router";
import clsx from "clsx";
import type { JSX } from "solid-js";
import {
  createEffect,
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
import { GraphTemporaryEdge } from "./components/GraphTemporaryEdge";
import { PORT_OFFSET, PORT_RADIUS, PORT_SPACING } from "./constants";
import { GraphContext, type TemporaryEdge } from "./context";
import type { GraphConfig, RenderProps } from "./lib/create-graph";
import { createGraph } from "./lib/create-graph";
import { createGraphProjection } from "./lib/create-graph-projection";
import {
  createWorkletFileSystem,
  getSourceBoilerplate,
  getWorkletEntry,
} from "./lib/worklet-file-system";
import { HorizontalSlider } from "./ui/HorizontalSlider";
import { Select } from "./ui/Select";

function NodeUI<S extends Record<string, any>>(
  props: RenderProps<S> & {
    title: string;
    children?: (props: RenderProps<S>) => JSX.Element;
  },
) {
  return (
    <>
      <text x={PORT_RADIUS * 2} y={17} font-size="12" fill="var(--color-text)">
        {props.title}
      </text>
      {props.children && (
        <foreignObject
          x={PORT_SPACING - PORT_RADIUS}
          y={PORT_OFFSET - PORT_RADIUS}
          width={props.dimensions.x - PORT_SPACING * 2 + PORT_RADIUS}
          height={props.dimensions.y - (PORT_OFFSET - PORT_RADIUS) - 5}
          class={styles.foreignObject}
        >
          {props.children(props)}
        </foreignObject>
      )}
    </>
  );
}

function GraphEditor(props: { graphName: string }) {
  const navigate = useNavigate();
  const ctx = new AudioContext();
  const workletFS = createWorkletFileSystem();
  const workletNodes = new ReactiveMap<string, AudioWorkletNode>();
  const analyserNodes = new ReactiveMap<string, AnalyserNode>();
  const envelopeTriggers = new Map<string, () => void>();
  const sequencerGates = new Map<string, (value: number) => void>();
  const [selectedType, setSelectedType] = createSignal<string | undefined>(
    "oscillator",
  );

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
      dimensions: { x: 280, y: 250 },
      resizable: true,
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { name: "", code },
      render: createWorkletRender(name.trim(), typeName),
    });
    graph.updateNode(nodeId, { type: typeName });
  }

  function createWorkletRender(title: string, typeKey: string) {
    const isSaved = typeKey !== "audioworklet";

    return (props: RenderProps<{ name: string; code: string }>) => (
      <NodeUI title={title} {...props}>
        {(props) => {
          if (isSaved) {
            createEffect(
              on(
                () => config[typeKey]?.state?.code as string | undefined,
                (savedCode) => {
                  if (!savedCode || !props.state.name) return;
                  props.setState("code", savedCode);
                  workletFS.writeFile(
                    `/${props.state.name}/source.js`,
                    savedCode,
                  );
                },
                { defer: true },
              ),
            );
          }

          const params = () => {
            const node = workletNodes.get(props.state.name);
            if (!node) return [];
            return Array.from(node.parameters.entries());
          };

          return (
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                height: `calc(100% - ${PORT_RADIUS}px)`,
                gap: "2px",
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
                  workletFS.writeFile(
                    `/${props.state.name}/source.js`,
                    newCode,
                  );
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: "2px",
                }}
              >
                {isSaved && (
                  <button
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
                  </button>
                )}
                <button
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
                </button>
              </div>
            </div>
          );
        }}
      </NodeUI>
    );
  }

  const [config, setConfig] = createStore<GraphConfig>({
    oscillator: {
      dimensions: { x: 180, y: 100 },
      ports: {
        in: [{ name: "frequency", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { frequency: 440, type: "sine" as OscillatorType },
      render: (props) => (
        <NodeUI title="Oscillator" {...props}>
          {(props) => (
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "2px",
              }}
            >
              <Select
                title="Type"
                value={props.state.type}
                options={["sine", "square", "sawtooth", "triangle"] as const}
                onChange={(value) => props.setState("type", value)}
              />
              <HorizontalSlider
                title="Freq"
                value={props.state.frequency}
                output={`${Math.round(props.state.frequency)}Hz`}
                disabled={props.isInputConnected("frequency")}
                onInput={(value) => props.setState("frequency", value)}
              />
            </div>
          )}
        </NodeUI>
      ),
    },
    gain: {
      dimensions: { x: 180, y: 75 },
      ports: {
        in: [{ name: "audio" }, { name: "gain", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { gain: 0.5 },
      render: (props) => (
        <NodeUI title="Gain" {...props}>
          {(props) => (
            <HorizontalSlider
              title="Gain"
              output={props.state.gain.toFixed(2)}
              value={props.state.gain}
              min={0}
              max={1}
              step={0.001}
              disabled={props.isInputConnected("gain")}
              onInput={(value) => props.setState("gain", value)}
            />
          )}
        </NodeUI>
      ),
    },
    constant: {
      dimensions: { x: 180, y: 75 },
      ports: {
        in: [],
        out: [{ name: "value", kind: "param" }],
      },
      state: { value: 440 },
      render: (props) => (
        <NodeUI title="Constant" {...props}>
          {(props) => (
            <HorizontalSlider
              title="Value"
              output={props.state.value}
              value={props.state.gain}
              onInput={(value) => props.setState("value", value)}
            />
          )}
        </NodeUI>
      ),
    },
    scale: {
      dimensions: { x: 180, y: 75 },
      ports: {
        in: [{ name: "signal", kind: "param" }],
        out: [{ name: "scaled", kind: "param" }],
      },
      state: { factor: 1000 },
      render: (props) => (
        <NodeUI title="Scale" {...props}>
          {(props) => (
            <HorizontalSlider
              title="Factor"
              value={props.state.factor}
              output={props.state.factor.toFixed(0)}
              min={-10000}
              max={10000}
              step={1}
              onInput={(value) => props.setState("factor", value)}
            />
          )}
        </NodeUI>
      ),
    },
    range: {
      dimensions: { x: 180, y: 110 },
      ports: {
        in: [{ name: "signal", kind: "param" }],
        out: [{ name: "mapped", kind: "param" }],
      },
      state: { min: 200, max: 2000 },
      render: (props) => (
        <NodeUI title="Range" {...props}>
          {(props) => (
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "2px",
              }}
            >
              <HorizontalSlider
                title="Min"
                value={props.state.min}
                output={props.state.min.toFixed(0)}
                min={0}
                max={10000}
                step={1}
                onInput={(value) => props.setState("min", value)}
              />
              <HorizontalSlider
                title="Max"
                value={props.state.max}
                output={props.state.max.toFixed(0)}
                min={0}
                max={10000}
                step={1}
                onInput={(value) => props.setState("max", value)}
              />
            </div>
          )}
        </NodeUI>
      ),
    },
    filter: {
      dimensions: { x: 180, y: 110 },
      ports: {
        in: [
          { name: "audio" },
          { name: "frequency", kind: "param" },
          { name: "Q", kind: "param" },
        ],
        out: [{ name: "audio" }],
      },
      state: { frequency: 1000, Q: 1 },
      render: (props) => (
        <NodeUI title="Filter" {...props}>
          {(props) => (
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "2px",
              }}
            >
              <HorizontalSlider
                title="Freq"
                value={props.state.frequency}
                output={`${Math.round(props.state.frequency)}Hz`}
                min={20}
                max={20000}
                step={1}
                disabled={props.isInputConnected("frequency")}
                onInput={(value) => props.setState("frequency", value)}
              />
              <HorizontalSlider
                title="Q"
                value={props.state.Q}
                output={props.state.Q.toFixed(1)}
                min={0.1}
                max={20}
                step={0.1}
                disabled={props.isInputConnected("Q")}
                onInput={(value) => props.setState("Q", value)}
              />
            </div>
          )}
        </NodeUI>
      ),
    },
    delay: {
      dimensions: { x: 180, y: 75 },
      ports: {
        in: [{ name: "audio" }, { name: "delayTime", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { delayTime: 0.3 },
      render: (props) => (
        <NodeUI title="Delay" {...props}>
          {(props) => (
            <HorizontalSlider
              title="Time"
              value={props.state.delayTime}
              output={`${props.state.delayTime.toFixed(2)}s`}
              min={0}
              max={1}
              step={0.01}
              disabled={props.isInputConnected("delayTime")}
              onInput={(value) => props.setState("delayTime", value)}
            />
          )}
        </NodeUI>
      ),
    },
    panner: {
      dimensions: { x: 180, y: 75 },
      ports: {
        in: [{ name: "audio" }, { name: "pan", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { pan: 0 },
      render: (props) => (
        <NodeUI title="Panner" {...props}>
          {(props) => (
            <HorizontalSlider
              title="Pan"
              value={props.state.pan}
              output={props.state.pan.toFixed(2)}
              min={-1}
              max={1}
              step={0.01}
              disabled={props.isInputConnected("pan")}
              onInput={(value) => props.setState("pan", value)}
            />
          )}
        </NodeUI>
      ),
    },
    compressor: {
      dimensions: { x: 180, y: 180 },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { threshold: -24, ratio: 12, attack: 0.003, release: 0.25 },
      render: (props) => (
        <NodeUI title="Compressor" {...props}>
          {(props) => (
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "2px",
              }}
            >
              <HorizontalSlider
                title="Thresh"
                value={props.state.threshold}
                output={`${props.state.threshold}dB`}
                min={-100}
                max={0}
                step={1}
                onInput={(v) => props.setState("threshold", v)}
              />
              <HorizontalSlider
                title="Ratio"
                value={props.state.ratio}
                output={`${props.state.ratio}:1`}
                min={1}
                max={20}
                step={0.1}
                onInput={(v) => props.setState("ratio", v)}
              />
              <HorizontalSlider
                title="Attack"
                value={props.state.attack}
                output={`${props.state.attack.toFixed(3)}s`}
                min={0}
                max={1}
                step={0.001}
                onInput={(v) => props.setState("attack", v)}
              />
              <HorizontalSlider
                title="Release"
                value={props.state.release}
                output={`${props.state.release.toFixed(2)}s`}
                min={0}
                max={1}
                step={0.01}
                onInput={(v) => props.setState("release", v)}
              />
            </div>
          )}
        </NodeUI>
      ),
    },
    reverb: {
      dimensions: { x: 180, y: 110 },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { decay: 2, mix: 0.5 },
      render: (props) => (
        <NodeUI title="Reverb" {...props}>
          {(props) => (
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "2px",
              }}
            >
              <HorizontalSlider
                title="Decay"
                value={props.state.decay}
                output={`${props.state.decay.toFixed(1)}s`}
                min={0.1}
                max={10}
                step={0.1}
                disabled={props.isInputConnected("decay")}
                onInput={(value) => props.setState("decay", value)}
              />
              <HorizontalSlider
                title="Mix"
                value={props.state.mix}
                output={`${Math.round(props.state.mix * 100)}%`}
                min={0}
                max={1}
                step={0.01}
                onInput={(value) => props.setState("mix", value)}
              />
            </div>
          )}
        </NodeUI>
      ),
    },
    waveshaper: {
      dimensions: { x: 180, y: 75 },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { amount: 50, oversample: "4x" as OverSampleType },
      render: (props) => (
        <NodeUI title="Waveshaper" {...props}>
          {(props) => (
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "2px",
              }}
            >
              <HorizontalSlider
                title="Drive"
                value={props.state.amount}
                output={`${Math.round(props.state.amount)}%`}
                min={0}
                max={100}
                step={1}
                disabled={props.isInputConnected("amount")}
                onInput={(value) => props.setState("amount", value)}
              />
            </div>
          )}
        </NodeUI>
      ),
    },
    analyser: {
      dimensions: { x: 200, y: 130 },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      render: (props) => (
        <NodeUI title="Analyser" {...props}>
          {(props) => (
            <canvas
              ref={(canvas) => {
                const canvasCtx = canvas.getContext("2d")!;
                let animId: number;
                const draw = () => {
                  const analyser = analyserNodes.get(props.id);
                  const w = canvas.width;
                  const h = canvas.height;
                  canvasCtx.fillStyle = "#1a1a2e";
                  canvasCtx.fillRect(0, 0, w, h);
                  if (analyser) {
                    const dataArray = new Uint8Array(
                      analyser.frequencyBinCount,
                    );
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
                  } else {
                    canvasCtx.strokeStyle = "#4a9eff33";
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(0, h / 2);
                    canvasCtx.lineTo(w, h / 2);
                    canvasCtx.stroke();
                  }
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
          )}
        </NodeUI>
      ),
    },
    noise: {
      dimensions: { x: 120, y: 60 },
      ports: {
        in: [],
        out: [{ name: "audio" }],
      },
      render: (props) => <NodeUI title="Noise" {...props} />,
    },
    lfo: {
      dimensions: { x: 180, y: 110 },
      ports: {
        in: [],
        out: [{ name: "modulation", kind: "param" }],
      },
      state: { rate: 2, depth: 0.5, type: "sine" as OscillatorType },
      render: (props) => (
        <NodeUI title="LFO" {...props}>
          {(props) => (
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "2px",
              }}
            >
              <HorizontalSlider
                title="Rate"
                value={props.state.rate}
                output={`${props.state.rate.toFixed(1)}Hz`}
                min={0.01}
                max={20}
                step={0.01}
                onInput={(value) => props.setState("rate", value)}
              />
              <HorizontalSlider
                title="Depth"
                value={props.state.depth}
                output={props.state.depth.toFixed(2)}
                min={0}
                max={1}
                step={0.01}
                onInput={(value) => props.setState("depth", value)}
              />
            </div>
          )}
        </NodeUI>
      ),
    },
    envelope: {
      dimensions: { x: 180, y: 200 },
      ports: {
        in: [{ name: "gate", kind: "param" }],
        out: [{ name: "envelope", kind: "param" }],
      },
      state: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 },
      render: (props) => (
        <NodeUI title="Envelope" {...props}>
          {(props) => (
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "2px",
              }}
            >
              <HorizontalSlider
                title="A"
                value={props.state.attack}
                output={`${props.state.attack.toFixed(2)}s`}
                min={0.001}
                max={2}
                step={0.001}
                onInput={(value) => props.setState("attack", value)}
              />
              <HorizontalSlider
                title="D"
                value={props.state.decay}
                output={`${props.state.decay.toFixed(2)}s`}
                min={0.001}
                max={2}
                step={0.001}
                onInput={(value) => props.setState("decay", value)}
              />
              <HorizontalSlider
                title="S"
                value={props.state.sustain}
                output={props.state.sustain.toFixed(2)}
                min={0}
                max={1}
                step={0.01}
                onInput={(value) => props.setState("sustain", value)}
              />
              <HorizontalSlider
                title="R"
                value={props.state.release}
                output={`${props.state.release.toFixed(2)}s`}
                min={0.001}
                max={5}
                step={0.001}
                onInput={(value) => props.setState("release", value)}
              />
              <button
                style={{
                  padding: "2px 4px",
                  "font-size": "10px",
                  cursor: "pointer",
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  const id = props.id;
                  envelopeTriggers.get(id)?.();
                }}
              >
                Trigger
              </button>
            </div>
          )}
        </NodeUI>
      ),
    },
    sequencer: {
      dimensions: { x: 280, y: 120 },
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
      render: (props) => (
        <NodeUI title="Sequencer" {...props}>
          {(props) => {
            const [currentStep, setCurrentStep] = createSignal(-1);
            const stepCount = () => props.state.steps.length;

            let timeoutId: number | undefined;
            let step = 0;
            let lastStepTime = 0;
            let running = false;

            const tick = () => {
              if (!running) return;
              setCurrentStep(step % stepCount());
              const isActive = props.state.steps[step % stepCount()];
              sequencerGates.get(props.id)?.(isActive ? 1 : 0);
              step++;
              lastStepTime = performance.now();
              timeoutId = setTimeout(
                tick,
                60000 / props.state.bpm / 4,
              ) as unknown as number;
            };

            const start = () => {
              stop();
              step = 0;
              running = true;
              tick();
            };

            const stop = () => {
              running = false;
              if (timeoutId !== undefined) clearTimeout(timeoutId);
              timeoutId = undefined;
              setCurrentStep(-1);
            };

            onCleanup(stop);

            return (
              <div
                style={{
                  display: "grid",
                  gap: "2px",
                  height: "100%",
                  "grid-template-rows": "auto 1fr auto",
                }}
              >
                <HorizontalSlider
                  title="BPM"
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
                          props.setState("steps", i(), !props.state.steps[i()])
                        }
                      />
                    )}
                  </For>
                </div>
                <div
                  style={{
                    display: "grid",
                    "grid-template-columns": "1fr 1fr",
                    gap: "2px",
                  }}
                >
                  <button
                    style={{
                      padding: "2px 4px",
                      "font-size": "10px",
                      cursor: "pointer",
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={start}
                  >
                    Play
                  </button>
                  <button
                    style={{
                      padding: "2px 4px",
                      "font-size": "10px",
                      cursor: "pointer",
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={stop}
                  >
                    Stop
                  </button>
                </div>
              </div>
            );
          }}
        </NodeUI>
      ),
    },
    destination: {
      dimensions: { x: 120, y: 60 },
      ports: {
        in: [{ name: "audio" }],
        out: [],
      },
      render: (props) => <NodeUI title="Output" {...props} />,
    },
    audioworklet: {
      dimensions: { x: 280, y: 250 },
      resizable: true,
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { name: "", code: "" },
      render: createWorkletRender("AudioWorklet", "audioworklet"),
    },
  });

  // Reconstruct saved custom types from persistence
  for (const key of Object.keys(savedTypes)) {
    const data = savedTypes[key];
    if (data && !config[key]) {
      setConfig(key, {
        dimensions: { x: 280, y: 250 },
        resizable: true,
        ports: {
          in: [{ name: "audio" }],
          out: [{ name: "audio" }],
        },
        state: { name: "", code: data.code },
        render: createWorkletRender(data.displayName, key),
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

  // Audio projection
  const projectionFactories = {
    oscillator(state: { frequency: number; type: OscillatorType }) {
      const osc = ctx.createOscillator();
      osc.start();

      createEffect(() => {
        osc.frequency.value = state.frequency;
      });
      createEffect(() => {
        osc.type = state.type;
      });

      onCleanup(() => osc.stop());

      return {
        in: {
          frequency: osc.frequency,
          detune: osc.detune,
        },
        out: {
          audio: osc,
        },
      };
    },
    gain(state: { gain: number }) {
      const gainNode = ctx.createGain();

      createEffect(() => {
        gainNode.gain.value = state.gain;
      });

      return {
        in: {
          audio: gainNode,
          gain: gainNode.gain,
        },
        out: {
          audio: gainNode,
        },
      };
    },
    constant(state: { value: number }) {
      const src = ctx.createConstantSource();
      src.start();

      createEffect(() => {
        src.offset.value = state.value;
      });

      onCleanup(() => src.stop());

      return {
        in: {},
        out: {
          value: src,
        },
      };
    },
    scale(state: { factor: number }) {
      const gain = ctx.createGain();

      createEffect(() => {
        gain.gain.value = state.factor;
      });

      return {
        in: { signal: gain },
        out: { scaled: gain },
      };
    },
    range(state: { min: number; max: number }) {
      const scaleGain = ctx.createGain();
      const offset = ctx.createConstantSource();
      offset.start();
      scaleGain.connect(offset.offset);

      createEffect(() => {
        scaleGain.gain.value = (state.max - state.min) / 2;
        offset.offset.value = (state.min + state.max) / 2;
      });

      onCleanup(() => offset.stop());

      return {
        in: { signal: scaleGain },
        out: { mapped: offset },
      };
    },
    filter(state: { frequency: number; Q: number }) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";

      createEffect(() => {
        filter.frequency.value = state.frequency;
      });
      createEffect(() => {
        filter.Q.value = state.Q;
      });

      return {
        in: { audio: filter, frequency: filter.frequency, Q: filter.Q },
        out: { audio: filter },
      };
    },
    delay(state: { delayTime: number }) {
      const delay = ctx.createDelay(1);

      createEffect(() => {
        delay.delayTime.value = state.delayTime;
      });

      return {
        in: { audio: delay, delayTime: delay.delayTime },
        out: { audio: delay },
      };
    },
    panner(state: { pan: number }) {
      const panner = ctx.createStereoPanner();

      createEffect(() => {
        panner.pan.value = state.pan;
      });

      return {
        in: { audio: panner, pan: panner.pan },
        out: { audio: panner },
      };
    },
    compressor(state: {
      threshold: number;
      ratio: number;
      attack: number;
      release: number;
    }) {
      const comp = ctx.createDynamicsCompressor();

      createEffect(() => {
        comp.threshold.value = state.threshold;
      });
      createEffect(() => {
        comp.ratio.value = state.ratio;
      });
      createEffect(() => {
        comp.attack.value = state.attack;
      });
      createEffect(() => {
        comp.release.value = state.release;
      });

      return {
        in: { audio: comp },
        out: { audio: comp },
      };
    },
    reverb(state: { decay: number; mix: number }) {
      const convolver = ctx.createConvolver();
      const dry = ctx.createGain();
      const wet = ctx.createGain();
      const input = ctx.createGain();
      const output = ctx.createGain();

      // Generate impulse response
      function generateImpulse(decay: number) {
        const length = ctx.sampleRate * decay;
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = impulse.getChannelData(channel);
          for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
          }
        }
        return impulse;
      }

      convolver.buffer = generateImpulse(state.decay);

      input.connect(dry);
      input.connect(convolver);
      convolver.connect(wet);
      dry.connect(output);
      wet.connect(output);

      createEffect(() => {
        convolver.buffer = generateImpulse(state.decay);
      });
      createEffect(() => {
        wet.gain.value = state.mix;
        dry.gain.value = 1 - state.mix;
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
      };
    },
    waveshaper(state: { amount: number; oversample: OverSampleType }) {
      const shaper = ctx.createWaveShaper();

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

      shaper.curve = makeDistortionCurve(state.amount);
      shaper.oversample = state.oversample;

      createEffect(() => {
        shaper.curve = makeDistortionCurve(state.amount);
      });
      createEffect(() => {
        shaper.oversample = state.oversample;
      });

      return {
        in: { audio: shaper },
        out: { audio: shaper },
      };
    },
    analyser(_state: Record<string, never>, nodeId: string) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserNodes.set(nodeId, analyser);

      onCleanup(() => {
        analyserNodes.delete(nodeId);
      });

      return {
        in: { audio: analyser },
        out: { audio: analyser },
      };
    },
    noise() {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      noise.start();

      onCleanup(() => noise.stop());

      return {
        in: {},
        out: { audio: noise },
      };
    },
    lfo(state: { rate: number; depth: number; type: OscillatorType }) {
      const osc = ctx.createOscillator();
      const depthGain = ctx.createGain();
      osc.connect(depthGain);
      osc.start();

      createEffect(() => {
        osc.frequency.value = state.rate;
      });
      createEffect(() => {
        osc.type = state.type;
      });
      createEffect(() => {
        depthGain.gain.value = state.depth;
      });

      onCleanup(() => osc.stop());

      return {
        in: {},
        out: { modulation: depthGain },
      };
    },
    envelope(
      state: {
        attack: number;
        decay: number;
        sustain: number;
        release: number;
      },
      nodeId: string,
    ) {
      const src = ctx.createConstantSource();
      src.offset.value = 0;
      src.start();

      // Gate input detection via AnalyserNode
      const gateInput = ctx.createAnalyser();
      gateInput.fftSize = 256;
      const gateData = new Float32Array(gateInput.fftSize);
      let gateOpen = false;
      let animId: number;

      const triggerAttack = () => {
        const now = ctx.currentTime;
        src.offset.cancelScheduledValues(now);
        src.offset.setTargetAtTime(1, now, state.attack / 3);
        src.offset.setTargetAtTime(
          state.sustain,
          now + state.attack,
          state.decay / 3,
        );
      };

      const triggerRelease = () => {
        const now = ctx.currentTime;
        src.offset.cancelScheduledValues(now);
        src.offset.setTargetAtTime(0, now, state.release / 3);
      };

      const checkGate = () => {
        gateInput.getFloatTimeDomainData(gateData);
        const isHigh = gateData[0] > 0.5;
        if (isHigh && !gateOpen) {
          gateOpen = true;
          triggerAttack();
        } else if (!isHigh && gateOpen) {
          gateOpen = false;
          triggerRelease();
        }
        animId = requestAnimationFrame(checkGate);
      };
      checkGate();

      // Manual trigger (button) fires full ADSR
      const trigger = () => {
        triggerAttack();
        const holdTime = state.attack + state.decay + 0.1;
        setTimeout(() => triggerRelease(), holdTime * 1000);
      };

      envelopeTriggers.set(nodeId, trigger);
      onCleanup(() => {
        envelopeTriggers.delete(nodeId);
        cancelAnimationFrame(animId);
        src.stop();
      });

      return {
        in: { gate: gateInput },
        out: { envelope: src },
      };
    },
    sequencer(_state: Record<string, never>, nodeId: string) {
      const src = ctx.createConstantSource();
      src.offset.value = 0;
      src.start();

      sequencerGates.set(nodeId, (value: number) => {
        src.offset.setValueAtTime(value, ctx.currentTime);
      });

      onCleanup(() => {
        sequencerGates.delete(nodeId);
        src.stop();
      });

      return {
        in: {},
        out: { gate: src },
      };
    },
    destination() {
      return {
        in: {
          audio: ctx.destination,
        },
      };
    },
    audioworklet(state: { name: string; code: string }) {
      const inputGain = ctx.createGain();
      const outputGain = ctx.createGain();

      let currentWorkletNode: AudioWorkletNode | null = null;
      let loadGeneration = 0;

      createEffect(() => {
        const name = state.name;
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

        ctx.audioWorklet
          .addModule(url)
          .then(() => {
            if (loadGeneration !== gen) return;
            const workletNode = new AudioWorkletNode(ctx, processorName);
            currentWorkletNode = workletNode;
            inputGain.connect(workletNode);
            workletNode.connect(outputGain);
            workletNodes.set(state.name, workletNode);
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
        workletNodes.delete(state.name);
      });

      return {
        in: { audio: inputGain },
        out: { audio: outputGain },
      };
    },
  };

  createGraphProjection(
    graph,
    new Proxy(projectionFactories, {
      get(target, prop, receiver) {
        return Reflect.get(target, prop, receiver) ?? target.audioworklet;
      },
    }) as any,
  );

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
              types: ["analyser"],
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
                        (graph.config[type]?.ports?.out?.[0] as any)
                          ?.kind || "audio";
                      return `var(--color-port-${kind})`;
                    };
                    return (
                      <button
                        class={clsx(
                          styles.button,
                          selectedType() === type && styles.selected,
                        )}
                        style={{
                          "border-color": `color-mix(in srgb, ${portColor()}, white 50%)`,
                        }}
                        onClick={() =>
                          setSelectedType((prev) =>
                            prev === type ? undefined : type,
                          )
                        }
                      >
                        {type}
                      </button>
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
        <button
          onClick={() => {
            const name = prompt("New graph name:");
            if (name?.trim()) navigate(`/${name.trim()}`);
          }}
          class={styles.button}
        >
          New Graph
        </button>
        <button
          onClick={() => {
            ctx.resume();
          }}
          class={styles.button}
        >
          Resume Audio
        </button>
      </div>
      <svg
        ref={(element) => {
          new ResizeObserver(() => {
            setStore("dimensions", element.getBoundingClientRect());
          }).observe(element);
        }}
        viewBox={`${-store.origin.x} ${store.origin.y} ${store.dimensions.width} ${store.dimensions.height}`}
        class={styles.svg}
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
              x: event.offsetX - store.origin.x,
              y: event.offsetY + store.origin.y,
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
          }
        }}
      >
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
  const params = useParams<{ graphName?: string }>();
  const navigate = useNavigate();

  createEffect(() => {
    if (!params.graphName) {
      navigate("/default", { replace: true });
    }
  });

  return (
    <Show when={params.graphName} keyed>
      {(graphName) => <GraphEditor graphName={graphName} />}
    </Show>
  );
};

export default App;
