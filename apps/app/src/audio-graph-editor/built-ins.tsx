import type {
  ConstructProps,
  ConstructResult,
  GraphConfig,
  NodeTypeDef,
} from "@audiograph/graph";
import { calcNodeHeight } from "@audiograph/graph";
import { when } from "@bigmistqke/solid-whenever";
import { ReactiveMap } from "@solid-primitives/map";
import {
  createComputed,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  mapArray,
  onCleanup,
  Show,
} from "solid-js";
import type { WorkletFileSystem } from "~/lib/worklet-file-system";
import { Button } from "~/ui/button";
import { HorizontalSlider } from "~/ui/horizontal-slider";
import { GraphNodeContent } from "~/ui/node-content";
import { Select } from "~/ui/select";
import styles from "./built-ins.module.css";

import { produce } from "solid-js/store";
import envelopeProcessorUrl from "~/lib/envelope-processor?url";
import sequencerProcessorUrl from "~/lib/sequencer-processor?url";

export interface AudioGraphContext {
  audioContext: AudioContext;
  workletFS: WorkletFileSystem;
  updateUserAudioWorkletNode(nodeId: string): void;
  addUserAudioWorkletNode(nodeId: string, code: string): void;
}

function createNodeDef<S extends Record<string, any> = Record<string, any>>(
  config: Omit<NodeTypeDef<S, AudioGraphContext>, "construct">,
  construct: (
    props: Omit<ConstructProps<S, AudioGraphContext>, "context"> & {
      context: AudioGraphContext;
    },
  ) => ConstructResult,
): NodeTypeDef<S, AudioGraphContext> {
  return {
    ...config,
    construct: construct as NodeTypeDef<S, AudioGraphContext>["construct"],
  };
}

const audioContextModuleMap = new ReactiveMap<
  AudioContext,
  ReactiveMap<string, Promise<void>>
>();
function addModule(context: AudioContext, url: string): Promise<true> {
  let moduleMap = audioContextModuleMap.get(context);
  if (!moduleMap) {
    moduleMap = new ReactiveMap();
    audioContextModuleMap.set(context, moduleMap);
  }
  let promise = moduleMap.get(url);
  if (!promise) {
    promise = context.audioWorklet.addModule(url);
    moduleMap.set(url, promise);
  }
  return promise.then(() => true);
}

export const builtIns = {
  oscillator: createNodeDef(
    {
      title: "oscillator",
      dimensions: { x: 180, y: calcNodeHeight(1, 2, true) },
      ports: {
        in: [{ name: "frequency", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { frequency: 440, type: "sine" as OscillatorType },
    },
    (props) => {
      const osc = props.context.audioContext.createOscillator();
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
        render: () => (
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
  ),
  gain: createNodeDef(
    {
      title: "gain",
      dimensions: { x: 180, y: calcNodeHeight(2, 1) },
      ports: {
        in: [{ name: "audio" }, { name: "gain", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { gain: 0.5 },
    },
    (props) => {
      const gainNode = props.context.audioContext.createGain();

      createEffect(() => {
        gainNode.gain.value = props.state.gain;
      });

      return {
        in: { audio: gainNode, gain: gainNode.gain },
        out: { audio: gainNode },
        render: () => (
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
  ),
  constant: createNodeDef(
    {
      title: "constant",
      dimensions: { x: 180, y: calcNodeHeight(1, 1) },
      ports: {
        in: [],
        out: [{ name: "value", kind: "param" }],
      },
      state: { value: 440 },
    },
    (props) => {
      const src = props.context.audioContext.createConstantSource();
      src.start();

      createEffect(() => {
        src.offset.value = props.state.value;
      });

      onCleanup(() => src.stop());

      return {
        in: {},
        out: { value: src },
        render: () => (
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
  ),
  scale: createNodeDef(
    {
      title: "scale",
      dimensions: { x: 180, y: calcNodeHeight(1, 1) },
      ports: {
        in: [{ name: "signal", kind: "param" }],
        out: [{ name: "scaled", kind: "param" }],
      },
      state: { factor: 1000 },
    },
    (props) => {
      const gain = props.context.audioContext.createGain();

      createEffect(() => {
        gain.gain.value = props.state.factor;
      });

      return {
        in: { signal: gain },
        out: { scaled: gain },
        render: () => (
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
  ),
  range: createNodeDef(
    {
      title: "range",
      dimensions: { x: 180, y: calcNodeHeight(1, 2) },
      ports: {
        in: [{ name: "signal", kind: "param" }],
        out: [{ name: "mapped", kind: "param" }],
      },
      state: { min: 200, max: 2000 },
    },
    (props) => {
      const scaleGain = props.context.audioContext.createGain();
      const offset = props.context.audioContext.createConstantSource();
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
        render: () => (
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
  ),
  filter: createNodeDef(
    {
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
    },
    (props) => {
      const filter = props.context.audioContext.createBiquadFilter();
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
        render: () => (
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
  ),
  delay: createNodeDef(
    {
      title: "delay",
      dimensions: { x: 180, y: calcNodeHeight(2, 1) },
      ports: {
        in: [{ name: "audio" }, { name: "delayTime", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { delayTime: 0.3 },
    },
    (props) => {
      const delay = props.context.audioContext.createDelay(1);

      createEffect(() => {
        delay.delayTime.value = props.state.delayTime;
      });

      return {
        in: { audio: delay, delayTime: delay.delayTime },
        out: { audio: delay },
        render: () => (
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
  ),
  panner: createNodeDef(
    {
      title: "panner",
      dimensions: { x: 180, y: calcNodeHeight(2, 1) },
      ports: {
        in: [{ name: "audio" }, { name: "pan", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { pan: 0 },
    },
    (props) => {
      const panner = props.context.audioContext.createStereoPanner();

      createEffect(() => {
        panner.pan.value = props.state.pan;
      });

      return {
        in: { audio: panner, pan: panner.pan },
        out: { audio: panner },
        render: () => (
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
  ),
  compressor: createNodeDef(
    {
      title: "compressor",
      dimensions: { x: 180, y: calcNodeHeight(1, 4) },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { threshold: -24, ratio: 12, attack: 0.003, release: 0.25 },
    },
    (props) => {
      const comp = props.context.audioContext.createDynamicsCompressor();

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
        render: () => (
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
  ),
  reverb: createNodeDef(
    {
      title: "reverb",
      dimensions: { x: 180, y: calcNodeHeight(1, 2) },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { decay: 2, mix: 0.5 },
    },
    (props) => {
      const convolver = props.context.audioContext.createConvolver();
      const dry = props.context.audioContext.createGain();
      const wet = props.context.audioContext.createGain();
      const input = props.context.audioContext.createGain();
      const output = props.context.audioContext.createGain();

      function generateImpulse(decay: number) {
        const length = props.context.audioContext.sampleRate * decay;
        const impulse = props.context.audioContext.createBuffer(
          2,
          length,
          props.context.audioContext.sampleRate,
        );
        for (let channel = 0; channel < 2; channel++) {
          const data = impulse.getChannelData(channel);
          for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
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
        render: () => (
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
  ),
  waveshaper: createNodeDef(
    {
      title: "waveshaper",
      dimensions: { x: 180, y: calcNodeHeight(1, 1) },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { amount: 50, oversample: "4x" as OverSampleType },
    },
    (props) => {
      const shaper = props.context.audioContext.createWaveShaper();

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
        render: () => (
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
  ),
  analyser: createNodeDef(
    {
      title: "analyser",
      dimensions: { x: 200, y: calcNodeHeight(1, 3) },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
    },
    (props) => {
      const analyser = props.context.audioContext.createAnalyser();
      analyser.fftSize = 2048;

      return {
        in: { audio: analyser },
        out: { audio: analyser },
        render: () => (
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
  ),
  meter: createNodeDef(
    {
      hideLabels: true,
      dimensions: { x: 30, y: calcNodeHeight(1, 3) },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
    },
    (props) => {
      const analyser = props.context.audioContext.createAnalyser();
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
        render: () => (
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
  ),
  debug: createNodeDef(
    {
      title: "debug",
      dimensions: { x: 180, y: calcNodeHeight(1, 1) },
      ports: {
        in: [{ name: "signal", kind: "param" }],
        out: [],
      },
    },
    (props) => {
      const analyser = props.context.audioContext.createAnalyser();
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
        render: () => (
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
  ),
  noise: createNodeDef(
    {
      title: "noise",
      dimensions: { x: 120, y: calcNodeHeight(1, 0) },
      ports: {
        in: [],
        out: [{ name: "audio" }],
      },
    },
    (props) => {
      const bufferSize = 2 * props.context.audioContext.sampleRate;
      const noiseBuffer = props.context.audioContext.createBuffer(
        1,
        bufferSize,
        props.context.audioContext.sampleRate,
      );
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = props.context.audioContext.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      noise.start();

      onCleanup(() => noise.stop());

      return {
        in: {},
        out: { audio: noise },
      };
    },
  ),
  lfo: createNodeDef(
    {
      title: "lfo",
      dimensions: { x: 180, y: calcNodeHeight(1, 2) },
      ports: {
        in: [],
        out: [{ name: "modulation", kind: "param" }],
      },
      state: { rate: 2, depth: 0.5, type: "sine" as OscillatorType },
    },
    (props) => {
      const osc = props.context.audioContext.createOscillator();
      const depthGain = props.context.audioContext.createGain();
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
        render: () => (
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
  ),
  envelope: createNodeDef(
    {
      title: "envelope",
      dimensions: { x: 180, y: calcNodeHeight(1, 5) },
      ports: {
        in: [{ name: "gate", kind: "param" }],
        out: [{ name: "envelope", kind: "param" }],
      },
      state: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 },
    },
    (props) => {
      const [resource] = createResource(() =>
        addModule(props.context.audioContext, envelopeProcessorUrl),
      );

      const node = createMemo(
        when(
          resource,
          () =>
            new AudioWorkletNode(
              props.context.audioContext,
              "envelope-processor",
              {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                outputChannelCount: [1],
              },
            ),
        ),
      );

      createComputed(
        when(node, (node) => {
          createComputed(() =>
            node.port.postMessage({
              type: "params",
              attack: props.state.attack,
              decay: props.state.decay,
              sustain: props.state.sustain,
              release: props.state.release,
            }),
          );
        }),
      );

      const trigger = () => node()?.port.postMessage({ type: "trigger" });

      return {
        in: {
          get gate() {
            return node();
          },
        },
        out: {
          get envelope() {
            return node();
          },
        },
        render: () => (
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
  ),
  sequencer: createNodeDef(
    {
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
    },
    (props) => {
      const [resource] = createResource(() =>
        addModule(props.context.audioContext, sequencerProcessorUrl),
      );

      const node = createMemo(
        when(
          resource,
          () =>
            new AudioWorkletNode(
              props.context.audioContext,
              "sequencer-processor",
              {
                numberOfInputs: 0,
                numberOfOutputs: 1,
                outputChannelCount: [1],
              },
            ),
        ),
      );

      createEffect(
        when(node, (node) => {
          node.port.postMessage({
            type: "bpm",
            value: props.state.bpm,
          });
          node.port.postMessage({
            type: "steps",
            value: props.state.steps.map((s: boolean) => (s ? 1 : 0)),
          });
          node.port.onmessage = (e: MessageEvent) => {
            if (e.data.type === "step") setCurrentStep(e.data.value);
          };

          createEffect(() => {
            node.port.postMessage({ type: "bpm", value: props.state.bpm });
          });

          createEffect(() => {
            node.port.postMessage({
              type: "steps",
              value: props.state.steps.map((s: boolean) => (s ? 1 : 0)),
            });
          });
        }),
      );

      const [currentStep, setCurrentStep] = createSignal(-1);

      const start = when(node, (node) => {
        node.port.postMessage({ type: "start" });
      });
      const stop = when(node, (node) =>
        node.port.postMessage({ type: "stop" }),
      );

      return {
        in: {},
        out: {
          get gate() {
            return node();
          },
        },
        render() {
          const stepCount = () => props.state.steps.length;
          return (
            <GraphNodeContent
              disabled={!resource()}
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
  ),
  destination: createNodeDef(
    {
      title: "output",
      dimensions: { x: 120, y: calcNodeHeight(1, 0) },
      ports: {
        in: [{ name: "audio" }],
        out: [],
      },
    },
    (props) => {
      return {
        in: { audio: props.context.audioContext.destination },
      };
    },
  ),
  audioworklet: createNodeDef(
    {
      title: "audioworklet",
      dimensions: { x: 280, y: calcNodeHeight(1, 7) },
      resizable: true,
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { name: "", code: "", metadata: {} as Record<string, number> },
    },
    (props) => {
      const inputGain = props.context.audioContext.createGain();
      const outputGain = props.context.audioContext.createGain();
      return {
        in: { audio: inputGain },
        out: { audio: outputGain },
        render() {
          const workletData = createMemo(() => {
            const name = props.state.name;
            if (!name) return;
            const url = props.context.workletFS.fileUrls.get(
              `/${name}/worklet.js`,
            );
            if (!url) return;
            return { url, name };
          });

          const [processorName] = createResource(
            workletData,
            async ({ url, name }) => {
              await props.context.audioContext.audioWorklet.addModule(url);
              return props.context.workletFS.getProcessorName(name);
            },
          );

          const [workletNode] = createResource(processorName, (name) => {
            const node = new AudioWorkletNode(props.context.audioContext, name);
            inputGain.connect(node);
            node.connect(outputGain);

            onCleanup(() => {
              inputGain.disconnect(node);
              node.disconnect(outputGain);
            });

            const { promise, resolve, reject } =
              Promise.withResolvers<AudioWorkletNode>();

            node.port.start();
            node.port.addEventListener("message", (event) => {
              if (event.data.type === "worklet-result") {
                if (event.data.success) {
                  resolve(node);
                } else {
                  reject(new Error(event.data.error));
                }
              }
            });

            return promise;
          });

          const workletParams = createMemo(() => {
            if (workletNode.error) return [];
            const node = workletNode();
            if (!node) return [];
            return Array.from(node.parameters.entries());
          });

          const workletError = () => {
            const error = workletNode.error;
            return error instanceof Error
              ? error.message.replace(
                  `Failed to execute 'registerProcessor' on 'AudioWorkletGlobalScope': `,
                  "",
                )
              : undefined;
          };

          const nodeType = () => props.graphStore.nodes[props.id]?.type;
          const isSaved = () => nodeType() !== "audioworklet";

          createEffect(
            mapArray(workletParams, ([name, param]) => {
              if (!(name in props.state.metadata)) {
                props.setState(
                  produce((state) => {
                    state.metadata[name] = param.value;
                  }),
                );
              }

              // onCleanup(() => {
              //   props.setState(
              //     produce((state) => {
              //       delete state.metadata[name];
              //     }),
              //   );
              // });
            }),
          );

          return (
            <GraphNodeContent class={styles["audioworklet-node-content"]}>
              <For each={workletParams()}>
                {([name, param]) => {
                  const min = () =>
                    param.minValue < -1e30 ? 0 : param.minValue;
                  const max = () =>
                    param.maxValue > 1e30 ? 1 : param.maxValue;

                  return (
                    <HorizontalSlider
                      title={name}
                      output={props.state.metadata[name]?.toFixed(2)}
                      value={props.state.metadata[name]}
                      min={min()}
                      max={max()}
                      step={(max() - min()) / 1000}
                      onInput={(value) => {
                        param.value = value;
                        props.setState(
                          produce((state) => {
                            state.metadata[name] = param.value;
                          }),
                        );
                      }}
                    />
                  );
                }}
              </For>
              <div class={styles["audioworklet-textarea-container"]}>
                <textarea
                  aria-errormessage={workletError()}
                  class={styles["audioworklet-textarea"]}
                  value={props.state.code}
                  spellcheck={false}
                  onInput={(e) => {
                    const newCode = e.currentTarget.value;
                    props.setState("code", newCode);
                    props.context.workletFS.writeFile(
                      `/${props.state.name}/source.js`,
                      newCode,
                    );
                  }}
                />
                <Show when={workletError()}>
                  {(error) => (
                    <div class={styles["audioworklet-textarea-error"]}>
                      {error()}
                    </div>
                  )}
                </Show>
              </div>
              <div class={styles["audioworklet-button-container"]}>
                <Show when={isSaved()}>
                  <Button
                    style={{
                      flex: 1,
                      padding: "2px 4px",
                      "font-size": "10px",
                      cursor: "pointer",
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() =>
                      props.context.updateUserAudioWorkletNode(props.id)
                    }
                  >
                    save
                  </Button>
                </Show>
                <Button
                  style={{
                    flex: 1,
                    padding: "2px 4px",
                    "font-size": "10px",
                    cursor: "pointer",
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() =>
                    props.context.addUserAudioWorkletNode(
                      props.state.code,
                      props.id,
                    )
                  }
                >
                  {isSaved() ? "save as" : "save as type"}
                </Button>
              </div>
            </GraphNodeContent>
          );
        },
      };
    },
  ),
} satisfies GraphConfig<AudioGraphContext>;
