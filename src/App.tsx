import { minni } from "@bigmistqke/minni";
import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  Show,
  type Component,
} from "solid-js";
import { createStore } from "solid-js/store";
import styles from "./App.module.css";
import { GraphEdge } from "./components/GraphEdge";
import { GraphNode } from "./components/GraphNode";
import { GraphTemporaryEdge } from "./components/GraphTemporaryEdge";
import { GraphContext, type TemporaryEdge } from "./context";
import { createGraph } from "./create-graph";
import { createGraphProjection } from "./create-graph-projection";
import { createNodeComponent } from "./create-node-component";

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
      render: createNodeComponent("Oscillator", (props) => (
        <label style={{ "font-size": "10px", color: "black" }}>
          Freq: {Math.round(props.state.frequency)}Hz
          <input
            type="range"
            min={20}
            max={2000}
            value={props.state.frequency}
            onInput={(e) => props.setState("frequency", +e.currentTarget.value)}
            style={{ width: "100%", "margin-inline": 0 }}
          />
        </label>
      )),
    },
    gain: {
      dimensions: { x: 180, y: 110 },
      ports: {
        in: [{ name: "audio" }, { name: "gain", kind: "param" }],
        out: [{ name: "audio" }],
      },
      state: { gain: 0.5 },
      render: createNodeComponent("Gain", (props) => (
        <label style={{ "font-size": "10px", color: "black" }}>
          Gain: {props.state.gain.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={props.state.gain}
            onInput={(e) => props.setState("gain", +e.currentTarget.value)}
            style={{ width: "100%", "margin-inline": 0 }}
          />
        </label>
      )),
    },
    destination: {
      dimensions: { x: 120, y: 60 },
      ports: {
        in: [{ name: "audio" }],
        out: [],
      },
      render: createNodeComponent("Output"),
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
    dragging: boolean;
  }>({
    origin: { x: 0, y: 0 },
    dimensions: { width: 0, height: 0 },
    temporaryEdge: undefined,
    dragging: false,
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
            graph.addNode(selectedType() as any, {
              x: event.offsetX - store.origin.x,
              y: event.offsetY + store.origin.y,
            });
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
