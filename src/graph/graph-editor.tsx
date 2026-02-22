import { minni } from "@bigmistqke/minni";
import { For, Show } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import { GraphEdge } from "./components/edge";
import { GraphNode } from "./components/node";
import { GraphTemporaryEdge } from "./components/temporary-edge";
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
import type { GraphAPI, GraphConfig, GraphStore } from "./create-graph";
import { createGraph } from "./create-graph";
import styles from "./graph-editor.module.css";

export function GraphEditor<T>(props: {
  graphName: string;
  context: T;
  config: GraphConfig<T>;
  setConfig: SetStoreFunction<GraphConfig<T>>;
  store: GraphStore;
  setStore: SetStoreFunction<GraphStore>;
  onClick(event: {
    x: number;
    y: number;
    graph: GraphAPI<GraphConfig<T>>;
  }): void;
}) {
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

  const graph = createGraph(props);

  // // Initialize worklet files for persisted custom nodes
  // for (const node of Object.values(graph.store.nodes)) {
  //   const { state } = props.store.nodes[node.id];
  //   if (state?.name && state?.code) {
  //     const name = state.name;
  //     if (!workletFS.readFile(`/${name}/source.js`)) {
  //       workletFS.writeFile(`/${name}/source.js`, state.code);
  //       workletFS.writeFile(`/${name}/worklet.js`, getWorkletEntry(name));
  //     }
  //   }
  // }

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
            const x = snapToGrid(event.offsetX - store.origin.x);
            const y = snapToGrid(event.offsetY + store.origin.y);
            props.onClick({ x, y, graph });
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
