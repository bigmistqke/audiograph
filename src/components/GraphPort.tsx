import { minni } from "@bigmistqke/minni";
import styles from "../App.module.css";
import {
  PORT_INSET,
  PORT_OFFSET,
  PORT_RADIUS,
  PORT_SPACING,
} from "../constants";
import { useGraph, useNode } from "../context";
import type { EdgeHandle } from "../create-graph";

export function GraphPort(props: {
  name: string;
  index: number;
  kind: "in" | "out";
  dataKind?: string;
}) {
  const { node, typeDef } = useNode();
  const {
    graph,
    setTemporaryEdge,
    getTemporaryEdge,
    updateTemporaryEdge,
    setDragging,
  } = useGraph();

  const cx = () =>
    props.kind === "in" ? PORT_INSET : node.dimensions.x - PORT_INSET;
  const cy = () => props.index * PORT_SPACING + PORT_OFFSET;

  return (
    <circle
      cx={cx()}
      cy={cy()}
      r={PORT_RADIUS}
      data-kind={props.dataKind}
      class={styles.port}
      onPointerDown={async (event) => {
        event.stopPropagation();
        setDragging(true);

        // If dragging from an in-port with an existing edge, detach it
        if (props.kind === "in") {
          const existingEdge = graph.graph.edges.find(
            (e) => e.to.node === node.id && e.to.port === props.name,
          );
          if (existingEdge) {
            graph.unlink(existingEdge.from, existingEdge.to);
            const fromNode = graph.graph.nodes.find(
              (n) => n.id === existingEdge.from.node,
            );
            if (fromNode) {
              const position = {
                x: node.x + cx(),
                y: node.y + cy(),
              };
              setTemporaryEdge({
                node: fromNode.id,
                kind: "out",
                port: existingEdge.from.port,
                x: position.x,
                y: position.y,
              });
              await minni(event, (delta) => {
                updateTemporaryEdge(position.x + delta.x, position.y - delta.y);
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
