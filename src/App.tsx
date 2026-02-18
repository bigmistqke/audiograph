import { minni } from "@bigmistqke/minni";
import type { JSX } from "solid-js";
import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  Show,
  type Component,
} from "solid-js";
import { ReactiveMap } from "@solid-primitives/map";
import { createStore } from "solid-js/store";
import styles from "./App.module.css";
import { GraphEdge } from "./components/GraphEdge";
import { GraphNode } from "./components/GraphNode";
import { GraphTemporaryEdge } from "./components/GraphTemporaryEdge";
import {
  PORT_INSET,
  PORT_OFFSET,
  PORT_RADIUS,
  PORT_SPACING,
} from "./constants";
import { GraphContext, type TemporaryEdge } from "./context";
import type { RenderProps } from "./lib/create-graph";
import { createGraph } from "./lib/create-graph";
import { createGraphProjection } from "./lib/create-graph-projection";
import {
  createWorkletFileSystem,
  getSourceBoilerplate,
  getWorkletEntry,
} from "./lib/worklet-file-system";
import { HorizontalSlider } from "./ui/HorizontalSlider";

function NodeUI<S extends Record<string, any>>(
  props: RenderProps<S> & {
    title: string;
    children?: (props: RenderProps<S>) => JSX.Element;
  },
) {
  const inset = PORT_INSET * 2 + PORT_SPACING - PORT_RADIUS;
  return (
    <>
      <text x={PORT_INSET - PORT_RADIUS} y={17} font-size="12" fill="black">
        {props.title}
      </text>
      {props.children && (
        <foreignObject
          x={inset}
          y={PORT_OFFSET - PORT_RADIUS}
          width={props.dimensions.x - inset * 2}
          height={props.dimensions.y - (PORT_OFFSET - PORT_RADIUS) - 5}
          class={styles.foreignObject}
        >
          {props.children(props)}
        </foreignObject>
      )}
    </>
  );
}

const App: Component = () => {
  const ctx = new AudioContext();
  const workletFS = createWorkletFileSystem();
  const workletNodes = new ReactiveMap<string, AudioWorkletNode>();
  const [selectedType, setSelectedType] = createSignal<string>("oscillator");

  const graph = createGraph({
    oscillator: {
      dimensions: { x: 200, y: 130 },
      ports: {
        in: [
          { name: "frequency", kind: "param" },
          { name: "type", kind: "oscillator-type" },
        ],
        out: [{ name: "audio" }],
      },
      state: { frequency: 440, type: "sine" as OscillatorType },
      render: (props) => (
        <NodeUI title="Oscillator" {...props}>
          {(props) => (
            <HorizontalSlider
              title="Freq"
              value={props.state.frequency}
              output={`${Math.round(props.state.frequency)}Hz`}
              disabled={props.isInputConnected("frequency")}
              onInput={(value) => props.setState("frequency", value)}
            />
          )}
        </NodeUI>
      ),
    },
    gain: {
      dimensions: { x: 180, y: 110 },
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
              disabled={props.isInputConnected("gain")}
              onInput={(value) => props.setState("gain", value)}
            />
          )}
        </NodeUI>
      ),
    },
    constant: {
      dimensions: { x: 180, y: 110 },
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
    destination: {
      dimensions: { x: 120, y: 60 },
      ports: {
        in: [{ name: "audio" }],
        out: [],
      },
      render: (props) => <NodeUI title="Output" {...props} />,
    },
    custom: {
      dimensions: { x: 280, y: 250 },
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { name: "", code: "" },
      render: (props) => (
        <NodeUI title="Custom" {...props}>
          {(props) => {
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
                  height: "100%",
                  gap: "2px",
                }}
              >
                <For each={params()}>
                  {([name, param]) => {
                    const min =
                      param.minValue < -1e30 ? 0 : param.minValue;
                    const max =
                      param.maxValue > 1e30 ? 1 : param.maxValue;
                    const [value, setValue] = createSignal(
                      param.defaultValue,
                    );
                    return (
                      <label
                        style={{
                          "font-size": "10px",
                          color: "black",
                          display: "flex",
                          "flex-direction": "column",
                        }}
                      >
                        <span>
                          {name}: {value().toFixed(2)}
                        </span>
                        <input
                          type="range"
                          min={min}
                          max={max}
                          step={(max - min) / 1000}
                          value={value()}
                          onInput={(e) => {
                            const v = +e.currentTarget.value;
                            setValue(v);
                            param.value = v;
                          }}
                          style={{ width: "100%", "margin-inline": 0 }}
                        />
                      </label>
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
              </div>
            );
          }}
        </NodeUI>
      ),
    },
  });

  // Audio projection
  createGraphProjection(graph, {
    oscillator(state) {
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
    gain(state) {
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
    constant(state) {
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
    destination() {
      return {
        in: {
          audio: ctx.destination,
        },
      };
    },
    custom(state) {
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
  });

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
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "8px",
          "align-items": "center",
        }}
      >
        <For each={Object.keys(graph.config)}>
          {(type) => (
            <button
              style={{
                background: selectedType() === type ? "#333" : "#eee",
                color: selectedType() === type ? "white" : "black",
                border: "1px solid #999",
                padding: "4px 12px",
                cursor: "pointer",
              }}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          )}
        </For>
        <button
          onClick={() => {
            ctx.resume();
          }}
          style={{
            "margin-left": "auto",
            border: "1px solid #999",
            padding: "4px 12px",
            cursor: "pointer",
          }}
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
            const type = selectedType() as any;
            const position = {
              x: event.offsetX - store.origin.x,
              y: event.offsetY + store.origin.y,
            };

            if (type === "custom") {
              const nodeId = graph.addNode(type, position);
              const name = `custom-${nodeId}`;

              const boilerplate = getSourceBoilerplate();
              workletFS.writeFile(`/${name}/source.js`, boilerplate);
              workletFS.writeFile(
                `/${name}/worklet.js`,
                getWorkletEntry(name),
              );

              const entry = graph.nodeStates.get(nodeId);
              if (entry) {
                entry.setState("name", name);
                entry.setState("code", boilerplate);
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
};

export default App;
