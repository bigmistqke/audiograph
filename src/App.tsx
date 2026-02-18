import { minni } from "@bigmistqke/minni";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
  useContext,
  type Component,
} from "solid-js";
import { createStore } from "solid-js/store";
import styles from "./App.module.css";
import {
  createGraph,
  type EdgeHandle,
  type NodeInstance,
} from "./create-graph";
import { createGraphProjection } from "./create-graph-projection";

// --- Types ---

interface TemporaryEdge {
  kind: "in" | "out";
  node: string;
  port: string;
  x?: number;
  y?: number;
}

// --- Contexts ---

type GraphAPI = ReturnType<typeof createGraph<any>>;

const GraphContext = createContext<{
  graph: GraphAPI;
  setTemporaryEdge(edge: TemporaryEdge | undefined): void;
  getTemporaryEdge(): TemporaryEdge | undefined;
  updateTemporaryEdge(x: number, y: number): void;
}>();

function useGraph() {
  const context = useContext(GraphContext);
  if (!context) throw new Error("useGraph must be used within GraphContext");
  return context;
}

const NodeContext = createContext<{ node: NodeInstance; typeDef: any }>();

function useNode() {
  const context = useContext(NodeContext);
  if (!context) throw new Error("useNode must be used within a Node");
  return context;
}

// --- Port ---

const PORT_SPACING = 20;
const PORT_OFFSET = 25;
const PORT_RADIUS = 5;
const PORT_INSET = 15;

function Port(props: { name: string; index: number; kind: "in" | "out" }) {
  const { node, typeDef } = useNode();
  const { graph, setTemporaryEdge, getTemporaryEdge, updateTemporaryEdge } =
    useGraph();

  const cx = () =>
    props.kind === "in" ? PORT_INSET : typeDef.dimensions.x - PORT_INSET;
  const cy = () => props.index * PORT_SPACING + PORT_OFFSET;

  return (
    <circle
      cx={cx()}
      cy={cy()}
      fill="white"
      stroke="black"
      r={PORT_RADIUS}
      onPointerDown={async (event) => {
        event.stopPropagation();
        setTemporaryEdge({
          node: node.id,
          kind: props.kind,
          port: props.name,
        });
        const position = {
          x: node.x + cx(),
          y: node.y + cy(),
        };
        await minni(event, (delta) => {
          updateTemporaryEdge(position.x + delta.x, position.y - delta.y);
        });
        setTemporaryEdge(undefined);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        const edgeHandle = getTemporaryEdge();
        if (!edgeHandle) return;
        if (edgeHandle.kind === props.kind) return;

        const from: EdgeHandle =
          props.kind === "in"
            ? { node: edgeHandle.node, port: edgeHandle.port }
            : { node: node.id, port: props.name };

        const to: EdgeHandle =
          props.kind === "out"
            ? { node: edgeHandle.node, port: edgeHandle.port }
            : { node: node.id, port: props.name };

        graph.link(from, to);
      }}
    />
  );
}

// --- Node ---

function Node(props: { node: NodeInstance }) {
  const { graph } = useGraph();
  const typeDef = graph.config[props.node.type];

  const rendered = (() => {
    if (!typeDef.render) return null;
    const entry = graph.nodeStates.get(props.node.id);
    return typeDef.render(entry?.state, entry?.setState);
  })();

  return (
    <NodeContext.Provider value={{ node: props.node, typeDef }}>
      <g transform={`translate(${props.node.x}, ${props.node.y})`}>
        <rect
          fill="white"
          stroke="black"
          width={typeDef.dimensions.x}
          height={typeDef.dimensions.y}
          onPointerDown={(event) => {
            const startPos = { x: props.node.x, y: props.node.y };
            minni(event, (delta) => {
              graph.updateNode(props.node.id, {
                x: startPos.x + delta.x,
                y: startPos.y - delta.y,
              });
            });
          }}
        />
        {rendered}
        {typeDef.ports.in.map((port: any, index: number) => (
          <Port name={port.name} index={index} kind="in" />
        ))}
        {typeDef.ports.out.map((port: any, index: number) => (
          <Port name={port.name} index={index} kind="out" />
        ))}
      </g>
    </NodeContext.Provider>
  );
}

// --- Edge ---

function portY(index: number) {
  return index * PORT_SPACING + PORT_OFFSET;
}

function EdgeView(props: { from: EdgeHandle; to: EdgeHandle }) {
  const { graph } = useGraph();

  const fromNode = createMemo(() =>
    graph.graph.nodes.find((n) => n.id === props.from.node),
  );
  const toNode = createMemo(() =>
    graph.graph.nodes.find((n) => n.id === props.to.node),
  );

  const fromPortIndex = () => {
    const node = fromNode();
    if (!node) return -1;
    return graph.config[node.type].ports.out.findIndex(
      (p: any) => p.name === props.from.port,
    );
  };

  const toPortIndex = () => {
    const node = toNode();
    if (!node) return -1;
    return graph.config[node.type].ports.in.findIndex(
      (p: any) => p.name === props.to.port,
    );
  };

  return (
    <Show when={fromNode() && toNode()}>
      <line
        pointer-events="none"
        x1={
          fromNode()!.x +
          graph.config[fromNode()!.type].dimensions.x -
          PORT_INSET
        }
        y1={fromNode()!.y + portY(fromPortIndex())}
        x2={toNode()!.x + PORT_INSET}
        y2={toNode()!.y + portY(toPortIndex())}
        stroke="black"
      />
    </Show>
  );
}

// --- Temporary Edge ---

function TemporaryEdgeView(props: TemporaryEdge) {
  const { graph } = useGraph();

  const node = createMemo(() =>
    graph.graph.nodes.find((n) => n.id === props.node),
  );

  const portIndex = () => {
    const n = node();
    if (!n) return -1;
    const ports =
      props.kind === "in"
        ? graph.config[n.type].ports.in
        : graph.config[n.type].ports.out;
    return ports.findIndex((p: any) => p.name === props.port);
  };

  return (
    <Show when={props.x !== undefined && props.y !== undefined && node()}>
      {(n) => (
        <line
          pointer-events="none"
          x1={
            n().x +
            (props.kind === "in"
              ? PORT_INSET
              : graph.config[n().type].dimensions.x - PORT_INSET)
          }
          y1={n().y + portY(portIndex())}
          x2={props.x}
          y2={props.y}
          stroke="black"
        />
      )}
    </Show>
  );
}

// --- App ---

const App: Component = () => {
  const ctx = new AudioContext();
  const [selectedType, setSelectedType] = createSignal<string>("oscillator");

  const graph = createGraph({
    oscillator: {
      dimensions: { x: 200, y: 130 },
      ports: {
        in: [
          { name: "frequency", kind: "param" },
          { name: "detune", kind: "param" },
        ],
        out: [{ name: "audio" }],
      },
      state: { frequency: 440, type: "sine" as OscillatorType },
      render: (state, setState) => (
        <>
          <text x={40} y={18} font-size="12" fill="black">
            Oscillator
          </text>
          <foreignObject x={15} y={55} width={170} height={60}>
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "4px",
              }}
            >
              <label style={{ "font-size": "10px", color: "black" }}>
                Freq: {Math.round(state.frequency)}Hz
                <input
                  type="range"
                  min={20}
                  max={2000}
                  value={state.frequency}
                  onInput={(e) => setState("frequency", +e.currentTarget.value)}
                  style={{ width: "100%" }}
                />
              </label>
            </div>
          </foreignObject>
        </>
      ),
    },
    gain: {
      dimensions: { x: 180, y: 110 },
      ports: {
        in: [{ name: "audio" }, { name: "gain", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { gain: 0.5 },
      render: (state, setState) => (
        <>
          <text x={40} y={18} font-size="12" fill="black">
            Gain
          </text>
          <foreignObject x={15} y={50} width={150} height={50}>
            <label style={{ "font-size": "10px", color: "black" }}>
              Gain: {state.gain.toFixed(2)}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.gain}
                onInput={(e) => setState("gain", +e.currentTarget.value)}
                style={{ width: "100%" }}
              />
            </label>
          </foreignObject>
        </>
      ),
    },
    destination: {
      dimensions: { x: 120, y: 60 },
      ports: {
        in: [{ name: "audio" }],
        out: [],
      },
      render: () => (
        <text x={20} y={40} font-size="12" fill="black">
          Output
        </text>
      ),
    },
  });

  // Audio projection
  createGraphProjection(graph, ctx, {
    oscillator: (ctx, state) => {
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
    gain: (ctx, state) => {
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
    destination: (ctx) => {
      return {
        in: {
          audio: ctx.destination,
        },
        out: {},
      };
    },
  });

  // --- UI State ---

  const [store, setStore] = createStore<{
    origin: { x: number; y: number };
    dimensions: { width: number; height: number };
    temporaryEdge: TemporaryEdge | undefined;
  }>({
    origin: { x: 0, y: 0 },
    dimensions: { width: 0, height: 0 },
    temporaryEdge: undefined,
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
        onMouseDown={async (event) => {
          if (event.target !== event.currentTarget) return;
          const _origin = { ...store.origin };
          const start = performance.now();

          await minni(event, (delta) => {
            setStore("origin", {
              x: _origin.x + delta.x,
              y: _origin.y + delta.y,
            });
          });

          if (performance.now() - start < 250) {
            graph.addNode(selectedType() as any, {
              x: event.offsetX - store.origin.x,
              y: event.offsetY + store.origin.y,
            });
          }
        }}
      >
        <For each={graph.graph.nodes}>{(node) => <Node node={node} />}</For>
        <For each={graph.graph.edges}>{(edge) => <EdgeView {...edge} />}</For>
        <Show when={store.temporaryEdge}>
          {(edge) => <TemporaryEdgeView {...edge()} />}
        </Show>
      </svg>
    </GraphContext.Provider>
  );
};

export default App;
