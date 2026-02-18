import { createMemo, Show } from "solid-js";
import { PORT_INSET, PORT_OFFSET, PORT_SPACING } from "../constants";
import { useGraph } from "../context";
import type { EdgeHandle } from "../create-graph";

function portY(index: number) {
  return index * PORT_SPACING + PORT_OFFSET;
}

export function GraphEdge(props: { from: EdgeHandle; to: EdgeHandle }) {
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
