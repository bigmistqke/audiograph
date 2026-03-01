import { Show } from "solid-js";
import {
  PORT_INSET,
  PORT_RADIUS,
  PORT_SPACING,
  TITLE_HEIGHT,
} from "../constants";
import { useGraph, type TemporaryEdge } from "../context";

function portY(index: number) {
  return index * PORT_SPACING + TITLE_HEIGHT + PORT_RADIUS;
}

export function GraphTemporaryEdge(props: TemporaryEdge) {
  const graph = useGraph();

  const port = () => {
    const node = graph.nodes[props.nodeId];
    if (!node) return undefined;
    const ports =
      props.kind === "in"
        ? graph.config[node.type].ports.in
        : graph.config[node.type].ports.out;
    return ports?.find((p: any) => p.name === props.portId);
  };

  const portIndex = () => {
    const node = graph.nodes[props.nodeId];
    if (!node) return -1;
    const ports =
      props.kind === "in"
        ? graph.config[node.type].ports.in
        : graph.config[node.type].ports.out;
    return ports?.indexOf(port()!) ?? -1;
  };

  const edgeColor = () => {
    const kind = (port() as any)?.kind || "audio";
    return `var(--color-port-${kind})`;
  };

  return (
    <Show
      when={
        props.x !== undefined &&
        props.y !== undefined &&
        graph.nodes[props.nodeId]
      }
    >
      {(node) => (
        <line
          pointer-events="none"
          x1={
            node().x +
            (props.kind === "in" ? PORT_INSET : node().width - PORT_INSET)
          }
          y1={node().y + portY(portIndex())}
          x2={props.x}
          y2={props.y}
          stroke={edgeColor()}
        />
      )}
    </Show>
  );
}
