import { createMemo, Show } from "solid-js";
import { PORT_INSET, PORT_OFFSET, PORT_SPACING } from "../constants";
import { useGraph } from "../context";
import type { EdgeHandle } from "../lib/create-graph";

function portY(index: number) {
  return index * PORT_SPACING + PORT_OFFSET;
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

  const EDGE_COLORS: Record<string, string> = {
    param: "#ff6b6b",
    output: "#51cf66",
  };
  const DEFAULT_EDGE_COLOR = "#4a9eff";

  const edgeColor = () => {
    const port = fromPort();
    const kind = (port as any)?.kind as string | undefined;
    return kind ? (EDGE_COLORS[kind] ?? DEFAULT_EDGE_COLOR) : DEFAULT_EDGE_COLOR;
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
