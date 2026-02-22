import { minni } from "@bigmistqke/minni";
import { Show } from "solid-js";
import {
  GRID,
  PORT_INSET,
  PORT_RADIUS,
  PORT_SPACING,
  TITLE_HEIGHT,
} from "../constants";
import { useGraph, useNode } from "../context";
import type { EdgeHandle } from "../create-graph";
import styles from "./port.module.css";

export function GraphPort(props: {
  name: string;
  index: number;
  kind: "in" | "out";
  dataKind?: string;
  hideLabels?: boolean;
}) {
  const { node } = useNode();
  const {
    graph,
    setTemporaryEdge,
    getTemporaryEdge,
    updateTemporaryEdge,
    setDragging,
  } = useGraph();

  const cx = () =>
    props.kind === "in" ? PORT_INSET : node.dimensions.x - PORT_INSET;
  const cy = () => props.index * PORT_SPACING + TITLE_HEIGHT + PORT_RADIUS;

  const labelX = () =>
    props.kind === "in" ? `${GRID + 1}px` : `${node.dimensions.x - GRID - 1}px`; //node.dimensions.x - PORT_RADIUS - CONTENT_PADDING_INLINE;

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
        data-kind={props.dataKind}
        onPointerUp={(event) => {
          event.stopPropagation();
          const edgeHandle = getTemporaryEdge();
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
          setDragging(true);

          // If dragging from an in-port with an existing edge, detach it
          if (props.kind === "in") {
            const existingEdge = graph.store.edges.find(
              (e) => e.input.node === node.id && e.input.port === props.name,
            );
            if (existingEdge) {
              graph.unlink(existingEdge.output, existingEdge.input);
              const fromNode = graph.store.nodes[existingEdge.output.node];
              if (fromNode) {
                const position = {
                  x: node.x + cx(),
                  y: node.y + cy(),
                };
                setTemporaryEdge({
                  node: fromNode.id,
                  kind: "out",
                  port: existingEdge.output.port,
                  x: position.x,
                  y: position.y,
                });
                await minni(event, (delta) => {
                  updateTemporaryEdge(
                    position.x + delta.x,
                    position.y - delta.y,
                  );
                });
                setTemporaryEdge(undefined);
                setDragging(false);
                return;
              }
            }
          }

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
          setDragging(false);
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
