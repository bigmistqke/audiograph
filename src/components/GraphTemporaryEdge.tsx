import { createMemo, Show } from "solid-js";
import { PORT_INSET, PORT_OFFSET, PORT_SPACING } from "../constants";
import { useGraph, type TemporaryEdge } from "../context";

function portY(index: number) {
  return index * PORT_SPACING + PORT_OFFSET;
}

export function GraphTemporaryEdge(props: TemporaryEdge) {
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
            (props.kind === "in" ? PORT_INSET : n().dimensions.x - PORT_INSET)
          }
          y1={n().y + portY(portIndex())}
          x2={props.x}
          y2={props.y}
          stroke="var(--color-edge)"
        />
      )}
    </Show>
  );
}
