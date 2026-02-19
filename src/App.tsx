import { minni } from "@bigmistqke/minni";
import { useNavigate, useParams } from "@solidjs/router";
import { ReactiveMap } from "@solid-primitives/map";
import { makePersisted } from "@solid-primitives/storage";
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
  const [selectedType, setSelectedType] = createSignal<string>("oscillator");

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
    const isSaved = typeKey !== "custom";

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
      dimensions: { x: 180, y: 75 },
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
      resizable: true,
      ports: {
        in: [{ name: "audio" }],
        out: [{ name: "audio" }],
      },
      state: { name: "", code: "" },
      render: createWorkletRender("Custom", "custom"),
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
    destination() {
      return {
        in: {
          audio: ctx.destination,
        },
      };
    },
    custom(state: { name: string; code: string }) {
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
        return Reflect.get(target, prop, receiver) ?? target.custom;
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
      <div class={styles.hud}>
        <For each={Object.keys(graph.config)}>
          {(type) => (
            <button
              class={clsx(
                styles.button,
                selectedType() === type && styles.selected,
              )}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          )}
        </For>
        <span
          style={{
            "margin-left": "auto",
            "font-size": "11px",
            "line-height": "28px",
            opacity: 0.6,
          }}
        >
          {props.graphName}
        </span>
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
            const type = selectedType() as any;
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
