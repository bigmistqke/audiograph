import { minni } from "@bigmistqke/minni";
import { createSignal, Show } from "solid-js";
import {
  GRID,
  PORT_INSET,
  PORT_RADIUS,
  PORT_SPACING,
  TITLE_HEIGHT,
} from "../constants";
import { useGraph, useNode } from "../context";
import type { EdgeHandle } from "../create-graph-api";
import styles from "./port.module.css";

export function GraphPort(props: {
  name: string;
  index: number;
  kind: "in" | "out";
  dataKind?: string;
  hideLabels?: boolean;
}) {
  const { node } = useNode();
  const graph = useGraph();

  const cx = () =>
    props.kind === "in" ? PORT_INSET : node.dimensions.x - PORT_INSET;
  const cy = () => props.index * PORT_SPACING + TITLE_HEIGHT + PORT_RADIUS;

  const labelX = () =>
    props.kind === "in" ? `${GRID + 1}px` : `${node.dimensions.x - GRID - 1}px`;

  const [hovered, setHovered] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);

  return (
    <g>
      <Show when={!props.hideLabels}>
        <text
          x={labelX()}
          y={cy()}
          dy="0.35em"
          text-anchor={props.kind === "in" ? "start" : "end"}
          class={styles.label}
        >
          {props.name}
        </text>
      </Show>

      <circle
        cx={cx()}
        cy={cy()}
        r={PORT_RADIUS * 2}
        class={styles.portExtended}
        classList={{ [styles.hovered]: hovered() && !disabled() }}
        data-kind={props.dataKind}
        style={{ cursor: disabled() ? "default" : undefined }}
        onPointerEnter={() => {
          let interactionPrevented = false;
          graph.onPortHover?.({
            handle: { node: node.id, port: props.name },
            kind: props.kind,
            preventInteraction: () => { interactionPrevented = true; },
          });
          setDisabled(interactionPrevented);
          setHovered(true);
        }}
        onPointerLeave={() => {
          graph.onPortHoverEnd?.({
            handle: { node: node.id, port: props.name },
            kind: props.kind,
          });
          setHovered(false);
          setDisabled(false);
        }}
        onPointerUp={(event) => {
          event.stopPropagation();
          if (disabled()) return;

          const edgeHandle = graph.getTemporaryEdge();

          if (!edgeHandle) return;
          if (edgeHandle.kind === props.kind) return;

          const output: EdgeHandle =
            props.kind === "in"
              ? { node: edgeHandle.node, port: edgeHandle.port }
              : { node: node.id, port: props.name };

          const input: EdgeHandle =
            props.kind === "out"
              ? { node: edgeHandle.node, port: edgeHandle.port }
              : { node: node.id, port: props.name };

          graph.link(output, input);
        }}
        onPointerDown={async (event) => {
          event.stopPropagation();
          if (disabled()) return;

          let detachPrevented = false;
          let linkingPrevented = false;
          graph.onPortDragStart?.({
            handle: { node: node.id, port: props.name },
            kind: props.kind,
            preventDetach: () => { detachPrevented = true; },
            preventLinking: () => { linkingPrevented = true; },
          });

          graph.setDragging(true);

          // Detach existing edge from in-port and re-drag from upstream node
          if (!detachPrevented && props.kind === "in") {
            const existingEdge = graph.graphStore.edges.find(
              (e) => e.input.node === node.id && e.input.port === props.name,
            );

            if (existingEdge) {
              graph.unlink(existingEdge.output, existingEdge.input);
              const fromNode = graph.graphStore.nodes[existingEdge.output.node];
              if (fromNode) {
                const position = {
                  x: node.x + cx(),
                  y: node.y + cy(),
                };

                graph.setTemporaryEdge({
                  node: fromNode.id,
                  kind: "out",
                  port: existingEdge.output.port,
                  x: position.x,
                  y: position.y,
                });

                await minni(event, (delta) => {
                  graph.updateTemporaryEdge(
                    position.x + delta.x,
                    position.y - delta.y,
                  );
                });

                graph.setTemporaryEdge(undefined);
                graph.setDragging(false);

                return;
              }
            }
          }

          graph.setTemporaryEdge({
            node: node.id,
            kind: props.kind,
            port: props.name,
          });
          const position = {
            x: node.x + cx(),
            y: node.y + cy(),
          };

          await minni(event, (delta) => {
            graph.updateTemporaryEdge(
              position.x + delta.x,
              position.y - delta.y,
            );
          });

          const cursor = graph.getCursorPosition();
          if (cursor) {
            graph.onPortDragEnd?.({
              handle: { node: node.id, port: props.name },
              kind: props.kind,
              x: cursor.x,
              y: cursor.y,
            });
          }

          if (linkingPrevented) {
            graph.setTemporaryEdge(undefined);
            graph.setDragging(false);
          } else {
            // Wait a frame so that port's onPointerUp
            // can receive the current temporary edge.
            requestAnimationFrame(() => {
              graph.setTemporaryEdge(undefined);
              graph.setDragging(false);
            });
          }
        }}
      />
      <circle
        cx={cx()}
        cy={cy()}
        r={PORT_RADIUS}
        data-kind={props.dataKind}
        class={styles.port}
      />
    </g>
  );
}
