import { minni } from "@bigmistqke/minni";
import { makePersisted } from "@solid-primitives/storage";
import { useNavigate } from "@solidjs/router";
import clsx from "clsx";
import { createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import styles from "./App.module.css";
import { builtIns, type AudioGraphContext } from "./built-ins";
import { GraphEdge } from "./components/GraphEdge";
import { GraphNode } from "./components/GraphNode";
import { GraphTemporaryEdge } from "./components/GraphTemporaryEdge";
import {
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
import type { GraphConfig, GraphStore } from "./lib/create-graph";
import { createGraph } from "./lib/create-graph";
import {
  createWorkletFileSystem,
  getSourceBoilerplate,
  getWorkletEntry,
} from "./lib/worklet-file-system";
import { Button } from "./ui/Button";

export function GraphEditor(props: {
  graphName: string;
  context: AudioContext;
}) {
  const navigate = useNavigate();
  const workletFS = createWorkletFileSystem();
  const [selectedType, setSelectedType] = createSignal<string | undefined>();

  const ctx: AudioGraphContext = {
    audio: props.context,
    workletFS,
  };

  const [config, setConfig] = createStore<GraphConfig<AudioGraphContext>>({
    ...builtIns,
  });

  const [graphStore, setGraphStore] = makePersisted(
    createStore<GraphStore>({ nodes: {}, edges: [] }),
    {
      name: `audiograph-${props.graphName}`,
    },
  );

  // Derive custom types from persisted nodes
  for (const node of Object.values(graphStore.nodes)) {
    if (!config[node.type] && node.state?.code !== undefined) {
      setConfig(node.type, {
        ...builtIns.audioworklet,
        title: node.type,
        state: { name: "", code: node.state.code },
      });
    }
  }

  const graph = createGraph({
    config,
    context: ctx,
    store: graphStore,
    setStore: setGraphStore,
  });

  // Initialize worklet files for persisted custom nodes
  for (const node of Object.values(graph.store.nodes)) {
    const { state } = graphStore.nodes[node.id];
    if (state?.name && state?.code) {
      const name = state.name;
      if (!workletFS.readFile(`/${name}/source.js`)) {
        workletFS.writeFile(`/${name}/source.js`, state.code);
        workletFS.writeFile(`/${name}/worklet.js`, getWorkletEntry(name));
      }
    }
  }

  // --- Save callbacks ---

  function saveAsNewType(code: string, nodeId: string) {
    const name = prompt("Name for this node type:");
    if (!name?.trim()) return;
    const typeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    setConfig(typeName, {
      ...builtIns.audioworklet,
      title: name.trim(),
      state: { name: "", code },
    });
    graph.updateNode(nodeId, { type: typeName });
  }

  function saveType(nodeId: string) {
    const node = graphStore.nodes[nodeId];
    if (!node) return;
    const typeName = node.type;
    const code = node.state?.code;
    if (!code || typeName === "audioworklet") return;

    // Update the config template
    setConfig(typeName, "state", "code", code);

    // Push code to all other nodes of the same type
    for (const [otherId, otherNode] of Object.entries(graphStore.nodes)) {
      if (otherNode.type === typeName && otherId !== nodeId) {
        setGraphStore("nodes", otherId, "state", "code", code);
        const name = otherNode.state?.name;
        if (name) {
          workletFS.writeFile(`/${name}/source.js`, code);
        }
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
        saveType,
        saveAsNewType,
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
            props.context.resume();
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

              setGraphStore("nodes", nodeId, "state", "name", name);
              setGraphStore("nodes", nodeId, "state", "code", code);
              workletFS.writeFile(`/${name}/source.js`, code);
              workletFS.writeFile(`/${name}/worklet.js`, getWorkletEntry(name));
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
        <For each={Object.values(graph.store.nodes)}>
          {(node) => <GraphNode node={node} />}
        </For>
        <For each={graph.store.edges}>{(edge) => <GraphEdge {...edge} />}</For>
        <Show when={store.temporaryEdge}>
          {(edge) => <GraphTemporaryEdge {...edge()} />}
        </Show>
      </svg>
    </GraphContext.Provider>
  );
}
