import { minni } from "@bigmistqke/minni";
import {
  createContext,
  createMemo,
  For,
  Index,
  Show,
  useContext,
  type Component,
} from "solid-js";
import { createStore } from "solid-js/store";
import styles from "./App.module.css";
import type * as GraphType from "./create-graph";
import { createGraph } from "./create-graph";
import { RPCAudioWorkletNode } from "./lib/rpc-audio-worklet-node";

async function createAudioWorkletNodeFactory<T extends { port: MessagePort }>(
  context: AudioContext,
  url: string,
  id: string,
) {
  await context.audioWorklet.addModule(url);
  return () => new RPCAudioWorkletNode<T>(context, id);
}

function Port(props: { index: number; id: string; kind: "in" | "out" }) {
  const node = useNode();
  const { graph, setTemporaryEdge, getTemporaryEdge, updateTemporaryEdge } =
    useGraph();

  return (
    <circle
      cx={props.kind === "in" ? 15 : node.width - 15}
      cy={(props.index + 1) * 10 + 5}
      fill="white"
      stroke="black"
      r={5}
      data-id={props.id}
      onPointerDown={async (event) => {
        event.stopPropagation();
        setTemporaryEdge({
          node: node.id,
          kind: props.kind,
          port: props.index,
        });
        const position = {
          x: node.x + (props.kind === "in" ? 15 : node.width - 15),
          y: node.y + (props.index + 1) * 10 + 5,
        };
        await minni(event, (delta) => {
          console.log(node.x, position.x, delta.x);
          updateTemporaryEdge(position.x + delta.x, position.y - delta.y);
        });
        setTemporaryEdge(undefined);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        const edgeHandle = getTemporaryEdge();

        if (!edgeHandle) {
          return;
        }

        if (edgeHandle.kind === props.kind) {
          return;
        }

        const from =
          props.kind === "in"
            ? edgeHandle
            : {
                node: node.id,
                port: props.index,
              };

        const to =
          props.kind === "out"
            ? edgeHandle
            : {
                node: node.id,
                port: props.index,
              };

        if (
          graph.graph.edges.find(
            (edgeHandle) =>
              edgeHandle.from.node === from.node &&
              edgeHandle.from.port === from.port &&
              edgeHandle.to.node === to.node &&
              edgeHandle.to.port === to.port,
          )
        ) {
          return;
        }
        graph.link(from, to);
      }}
    />
  );
}

const NodeContext = createContext<GraphType.Node>();

function useNode() {
  const context = useContext(NodeContext);
  if (!context) {
    throw new Error("useNode should be used in a descendant of Node");
  }
  return context;
}

function Node(
  props: GraphType.Node & {
    onEdit(node: Partial<GraphType.Node>): void;
  },
) {
  return (
    <NodeContext.Provider value={props}>
      <g transform={`translate(${props.x}, ${props.y})`}>
        <rect
          fill="white"
          stroke="black"
          width={props.width}
          height={props.height}
          onPointerDown={(event) => {
            const node = { ...props };
            minni(event, (delta) => {
              props.onEdit({ x: node.x + delta.x, y: node.y - delta.y });
            });
          }}
        ></rect>
        <Index each={props.ports.in}>
          {(port, index) => <Port id={port()} index={index} kind="in" />}
        </Index>
        <Index each={props.ports.out}>
          {(port, index) => <Port id={port()} index={index} kind="out" />}
        </Index>
      </g>
    </NodeContext.Provider>
  );
}

function TemporaryEdge(props: TemporaryEdge) {
  const { graph } = useGraph();

  const node = createMemo(() =>
    graph.graph.nodes.find((node) => node.id === props.node),
  );

  return (
    <Show when={props.x !== undefined && props.y !== undefined && node()}>
      {(node) => (
        <line
          pointer-events="none"
          x1={node().x + (props.kind === "in" ? 15 : node().width - 15)}
          y1={node().y + props.port * 10 + 15}
          x2={props.x}
          y2={props.y}
          stroke="black"
        />
      )}
    </Show>
  );
}

function Edge(props: { from: GraphType.EdgeHandle; to: GraphType.EdgeHandle }) {
  const { graph } = useGraph();

  const fromNode = createMemo(() =>
    graph.graph.nodes.find((node) => node.id === props.from.node),
  );
  const toNode = createMemo(() =>
    graph.graph.nodes.find((node) => node.id === props.to.node),
  );

  return (
    <Show when={fromNode()}>
      {(fromNode) => (
        <Show when={toNode()}>
          {(toNode) => (
            <line
              pointer-events="none"
              x1={fromNode().x + fromNode().width - 15}
              x2={toNode().x + 15}
              y1={fromNode().y + props.from.port * 10 + 15}
              y2={toNode().y + props.to.port * 10 + 15}
              stroke="black"
            />
          )}
        </Show>
      )}
    </Show>
  );
}

interface TemporaryEdge {
  kind: "in" | "out";
  node: string;
  port: number;
  x?: number;
  y?: number;
}

const GraphContext = createContext<{
  graph: GraphType.GraphAPI;
  setTemporaryEdge(edgeHandle: TemporaryEdge | undefined): void;
  getTemporaryEdge(): TemporaryEdge | undefined;
  updateTemporaryEdge(x: number, y: number): void;
}>();

function useGraph() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error("useGraph should be used in a descendant of Graph");
  }
  return context;
}

function Graph() {
  const graph = createGraph();

  const [store, setStore] = createStore<{
    origin: { x: number; y: number };
    dimensions: { width: number; height: number };
    temporaryEdge: TemporaryEdge | undefined;
  }>({
    origin: {
      x: 0,
      y: 0,
    },
    dimensions: {
      width: 0,
      height: 0,
    },
    temporaryEdge: undefined,
  });

  return (
    <GraphContext.Provider
      value={{
        graph,
        setTemporaryEdge(temporaryEdge) {
          setStore("temporaryEdge", temporaryEdge);
        },
        getTemporaryEdge() {
          return store.temporaryEdge;
        },
        updateTemporaryEdge(x, y) {
          setStore("temporaryEdge", (edge) =>
            edge ? { ...edge, x, y } : edge,
          );
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
        onMouseDown={async (event) => {
          if (event.target !== event.currentTarget) {
            return;
          }
          const _origin = { ...store.origin };
          const start = performance.now();

          await minni(event, (delta) => {
            setStore("origin", {
              x: _origin.x + delta.x,
              y: _origin.y + delta.y,
            });
          });

          if (performance.now() - start < 250) {
            graph.addNode({
              x: event.offsetX - store.origin.x,
              y: event.offsetY + store.origin.y,
              width: 150,
              height: 100,
              ports: {
                in: ["audio"],
                out: ["audio"],
              },
            });
          }
        }}
      >
        <For each={graph.graph.nodes}>
          {(node) => (
            <Node
              {...node}
              onEdit={(_node) => graph.updateNode(node.id, _node)}
            />
          )}
        </For>
        <For each={graph.graph.edges}>{(edge) => <Edge {...edge} />}</For>
        <Show when={store.temporaryEdge}>
          {(temporaryEdge) => <TemporaryEdge {...temporaryEdge()} />}
        </Show>
      </svg>
    </GraphContext.Provider>
  );
}

const App: Component = () => {
  const context = new AudioContext();

  return (
    <>
      <Graph />
    </>
  );
};

export default App;
