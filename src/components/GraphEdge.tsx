import { createMemo, Show } from "solid-js";
import {
  PORT_INSET,
  PORT_RADIUS,
  PORT_SPACING,
  TITLE_HEIGHT,
} from "../constants";
import { useGraph } from "../context";
import type { EdgeHandle } from "../lib/create-graph";

function portY(index: number) {
  return index * PORT_SPACING + TITLE_HEIGHT + PORT_RADIUS;
}

export function GraphEdge(props: { output: EdgeHandle; input: EdgeHandle }) {
  const { graph } = useGraph();

  const fromNode = createMemo(() =>
    graph.graph.nodes.find((n) => n.id === props.output.node),
  );
  const toNode = createMemo(() =>
    graph.graph.nodes.find((n) => n.id === props.input.node),
  );

  const fromPort = () => {
    const node = fromNode();
    if (!node) return undefined;
    return graph.config[node.type].ports.out.find(
      (p: any) => p.name === props.output.port,
    );
  };

  const fromPortIndex = () => {
    const node = fromNode();
    if (!node) return -1;
    return graph.config[node.type].ports.out.indexOf(fromPort()!);
  };

  const toPortIndex = () => {
    const node = toNode();
    if (!node) return -1;
    return graph.config[node.type].ports.in.findIndex(
      (p: any) => p.name === props.input.port,
    );
  };

  const edgeColor = () => {
    const kind = (fromPort() as any)?.kind || "audio";
    return `var(--color-port-${kind})`;
  };

  return (
    <Show when={fromNode() && toNode()}>
      <line
        pointer-events="none"
        x1={fromNode()!.x + fromNode()!.dimensions.x - PORT_INSET}
        y1={fromNode()!.y + portY(fromPortIndex())}
        x2={toNode()!.x + PORT_INSET}
        y2={toNode()!.y + portY(toPortIndex())}
        stroke={edgeColor()}
      />
    </Show>
  );
}
