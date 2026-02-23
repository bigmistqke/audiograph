import { minni } from "@bigmistqke/minni";
import clsx from "clsx";
import { For, mergeProps, Show, splitProps } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";
import { createStore } from "solid-js/store";
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
import { GraphContext, GraphContextType, type TemporaryEdge } from "./context";
import type {
  CreateGraphAPIConfig,
  Edge,
  EdgeHandle,
  GraphAPI,
  GraphConfig,
  NodeInstance,
} from "./create-graph-api";
import { createGraphAPI } from "./create-graph-api";
import styles from "./graph-editor.module.css";

function getNodesInRect(
  nodes: Record<string, NodeInstance>,
  rect: { x: number; y: number; width: number; height: number },
): string[] {
  return Object.values(nodes)
    .filter(
      (node) =>
        node.x < rect.x + rect.width &&
        node.x + node.dimensions.x > rect.x &&
        node.y < rect.y + rect.height &&
        node.y + node.dimensions.y > rect.y,
    )
    .map((n) => n.id);
}

export interface GraphEditorProps<
  TContext extends Record<string, any>,
> extends CreateGraphAPIConfig<unknown, TContext> {
  style?: JSX.CSSProperties;
  class?: string;
  onClick(event: {
    x: number;
    y: number;
    graph: GraphAPI<GraphConfig<TContext>>;
  }): void;
  onEdgeClick?(event: {
    edge: Edge;
    x: number;
    y: number;
    graph: GraphAPI<GraphConfig<TContext>>;
  }): void;
  /** Return true if a splice onto this edge should be allowed. */
  onEdgeSpliceValidate?(event: { edge: Edge }): boolean;
  /** Called when dragging from a port. Return true to prevent normal edge drag. */
  onPortDragStart?(event: {
    handle: EdgeHandle;
    kind: "in" | "out";
    graph: GraphAPI<GraphConfig<TContext>>;
  }): false | void;
  /** Called when port drag ends. Creates node and connects it. */
  onPortDragEnd?(event: {
    handle: EdgeHandle;
    kind: "in" | "out";
    x: number;
    y: number;
    graph: GraphAPI<GraphConfig<TContext>>;
  }): void;
  /** Fully positioned ghost node preview rendered in the SVG. */
  ghostNode?: {
    x: number;
    y: number;
    dimensions: { x: number; y: number };
    title: string;
    borderColor: string;
    ports?: {
      in?: { name: string; kind?: string }[];
      out?: { name: string; kind?: string }[];
    };
  };
  /** Fires when cursor position changes in SVG coordinates. */
  onCursorMove?(position: { x: number; y: number } | undefined): void;
}

export function GraphEditor<TContext extends Record<string, any>>(
  props: GraphEditorProps<TContext>,
) {
  const [UIState, setUIState] = createStore<{
    origin: { x: number; y: number };
    dimensions: { width: number; height: number };
    temporaryEdge: TemporaryEdge | undefined;
    dragging: boolean;
    cursorPosition: { x: number; y: number } | undefined;
    selectionBox:
      | {
          startX: number;
          startY: number;
          endX: number;
          endY: number;
        }
      | undefined;
    selectedNodes: string[];
  }>({
    origin: { x: 0, y: 0 },
    dimensions: { width: 0, height: 0 },
    temporaryEdge: undefined,
    dragging: false,
    cursorPosition: undefined,
    selectionBox: undefined,
    selectedNodes: [],
  });
  const [graphProps, rest] = splitProps(props, [
    "config",
    "context",
    "setGraphStore",
    "graphStore",
  ]);

  const graphAPI = createGraphAPI(graphProps);

  const context = mergeProps(graphAPI, {
    setTemporaryEdge(edge: TemporaryEdge) {
      setUIState("temporaryEdge", edge);
    },
    getTemporaryEdge() {
      return UIState.temporaryEdge;
    },
    updateTemporaryEdge(x: number, y: number) {
      setUIState("temporaryEdge", (edge) => (edge ? { ...edge, x, y } : edge));
    },
    setDragging(dragging: boolean) {
      if (dragging) window.getSelection()?.removeAllRanges();
      setUIState("dragging", dragging);
    },
    getCursorPosition() {
      return UIState.cursorPosition;
    },
    get selectedNodes() {
      return UIState.selectedNodes;
    },
    setSelectedNodes(ids: string[]) {
      setUIState("selectedNodes", ids);
    },
    onEdgeClick(event: { edge: Edge; x: number; y: number }) {
      rest.onEdgeClick?.({ ...event, graph: graphAPI });
    },
    onEdgeSpliceValidate(event: { edge: Edge }) {
      return rest.onEdgeSpliceValidate?.(event) ?? true;
    },
    onPortDragStart(event: { handle: EdgeHandle; kind: "in" | "out" }) {
      return rest.onPortDragStart?.({ ...event, graph: graphAPI }) ?? false;
    },
    onPortDragEnd(event: {
      handle: EdgeHandle;
      kind: "in" | "out";
      x: number;
      y: number;
    }) {
      rest.onPortDragEnd?.({ ...event, graph: graphAPI });
    },
  }) satisfies GraphContextType;

  return (
    <GraphContext.Provider value={context}>
      <svg
        ref={(element) => {
          new ResizeObserver(() => {
            setUIState("dimensions", element.getBoundingClientRect());
          }).observe(element);
        }}
        viewBox={`${-UIState.origin.x} ${UIState.origin.y} ${UIState.dimensions.width} ${UIState.dimensions.height}`}
        class={clsx(styles.svg, rest.class)}
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
          ...rest.style,
        }}
        data-dragging={UIState.dragging || undefined}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const pos = {
            x: event.clientX - rect.left - UIState.origin.x,
            y: event.clientY - rect.top + UIState.origin.y,
          };
          setUIState("cursorPosition", pos);
          rest.onCursorMove?.(pos);
        }}
        onPointerLeave={() => {
          setUIState("cursorPosition", undefined);
          rest.onCursorMove?.(undefined);
        }}
        onPointerDown={async (event) => {
          if (event.target !== event.currentTarget) return;

          if (event.shiftKey) {
            // Selection box mode
            const svgRect = event.currentTarget.getBoundingClientRect();
            const startX = event.clientX - svgRect.left - UIState.origin.x;
            const startY = event.clientY - svgRect.top + UIState.origin.y;

            setUIState("selectionBox", {
              startX,
              startY,
              endX: startX,
              endY: startY,
            });
            setUIState("dragging", true);

            await minni(event, (delta) => {
              setUIState("selectionBox", {
                startX,
                startY,
                endX: startX + delta.x,
                endY: startY - delta.y,
              });
              const box = UIState.selectionBox!;
              const x = Math.min(box.startX, box.endX);
              const y = Math.min(box.startY, box.endY);
              const width = Math.abs(box.endX - box.startX);
              const height = Math.abs(box.endY - box.startY);

              setUIState(
                "selectedNodes",
                getNodesInRect(props.graphStore.nodes, {
                  x,
                  y,
                  width,
                  height,
                }),
              );
            });

            setUIState("selectionBox", undefined);
            setUIState("dragging", false);
            return;
          }

          const _origin = { ...UIState.origin };
          const start = performance.now();

          setUIState("dragging", true);
          await minni(event, (delta) => {
            setUIState("origin", {
              x: _origin.x + delta.x,
              y: _origin.y + delta.y,
            });
          });
          setUIState("dragging", false);

          if (performance.now() - start < 250) {
            setUIState("selectedNodes", []);
            const x = snapToGrid(event.offsetX - UIState.origin.x);
            const y = snapToGrid(event.offsetY + UIState.origin.y);
            rest.onClick({ x, y, graph: graphAPI });
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
          x={-UIState.origin.x}
          y={UIState.origin.y}
          width={UIState.dimensions.width}
          height={UIState.dimensions.height}
          fill="url(#grid)"
          pointer-events="none"
        />
        <For each={Object.values(props.graphStore.nodes)}>
          {(node) => <GraphNode node={node} />}
        </For>
        <For each={props.graphStore.edges}>
          {(edge) => <GraphEdge {...edge} />}
        </For>
        <Show when={UIState.temporaryEdge}>
          {(edge) => <GraphTemporaryEdge {...edge()} />}
        </Show>
        <Show when={rest.ghostNode}>
          {(ghost) => (
            <g
              transform={`translate(${ghost().x}, ${ghost().y})`}
              opacity={0.4}
              pointer-events="none"
            >
              <rect
                width={ghost().dimensions.x}
                height={ghost().dimensions.y}
                fill="white"
                stroke={ghost().borderColor}
                stroke-width={1}
              />
              <text
                x={HEADING_PADDING_INLINE}
                y={HEADING_PADDING_BLOCK + 12}
                font-size="14"
                fill="var(--color-text)"
              >
                {ghost().title}
              </text>
              {ghost().ports?.in?.map((port, i) => (
                <circle
                  cx={PORT_INSET}
                  cy={i * PORT_SPACING + TITLE_HEIGHT + PORT_RADIUS}
                  r={PORT_RADIUS}
                  fill={`var(--color-port-${port.kind || "audio"})`}
                />
              ))}
              {ghost().ports?.out?.map((port, i) => (
                <circle
                  cx={ghost().dimensions.x - PORT_INSET}
                  cy={i * PORT_SPACING + TITLE_HEIGHT + PORT_RADIUS}
                  r={PORT_RADIUS}
                  fill={`var(--color-port-${port.kind || "audio"})`}
                />
              ))}
            </g>
          )}
        </Show>
        <Show when={UIState.selectionBox}>
          {(box) => {
            const x = () => Math.min(box().startX, box().endX);
            const y = () => Math.min(box().startY, box().endY);
            const width = () => Math.abs(box().endX - box().startX);
            const height = () => Math.abs(box().endY - box().startY);
            return (
              <rect
                x={x()}
                y={y()}
                width={width()}
                height={height()}
                class={styles.selectionBox}
              />
            );
          }}
        </Show>
      </svg>
    </GraphContext.Provider>
  );
}
