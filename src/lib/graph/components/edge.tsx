import { createMemo, Show } from "solid-js";
import {
  PORT_INSET,
  PORT_RADIUS,
  PORT_SPACING,
  TITLE_HEIGHT,
} from "../constants";
import { useGraph } from "../context";
import type { EdgeHandle } from "../create-graph-api";

function portY(index: number) {
  return index * PORT_SPACING + TITLE_HEIGHT + PORT_RADIUS;
}

export function GraphEdge(props: { output: EdgeHandle; input: EdgeHandle }) {
  const graph = useGraph();

  const fromNode = createMemo(() => graph.graphStore.nodes[props.output.node]);
  const toNode = createMemo(() => graph.graphStore.nodes[props.input.node]);

  const fromPort = () => {
    const node = fromNode();
    if (!node) return undefined;
    return graph.config[node.type].ports.out?.find(
      (p: any) => p.name === props.output.port,
    );
  };

  const fromPortIndex = () => {
    const node = fromNode();
    if (!node) return -1;
    return graph.config[node.type].ports.out?.indexOf(fromPort()!) ?? -1;
  };

  const toPortIndex = () => {
    const node = toNode();
    if (!node) return -1;
    return (
      graph.config[node.type].ports.in?.findIndex(
        (p: any) => p.name === props.input.port,
      ) ?? -1
    );
  };

  const edgeColor = () => {
    const kind = (fromPort() as any)?.kind || "audio";
    return `var(--color-port-${kind})`;
  };

  const x1 = () => fromNode()!.x + fromNode()!.dimensions.x - PORT_INSET;
  const y1 = () => fromNode()!.y + portY(fromPortIndex());
  const x2 = () => toNode()!.x + PORT_INSET;
  const y2 = () => toNode()!.y + portY(toPortIndex());

  return (
    <Show when={fromNode() && toNode()}>
      {/* Invisible wide hit-test line (only when splice is valid) */}
      <Show
        when={graph.onEdgeSpliceValidate?.({
          output: props.output,
          input: props.input,
        })}
      >
        <line
          x1={x1()}
          y1={y1()}
          x2={x2()}
          y2={y2()}
          stroke="transparent"
          stroke-width={10}
          style={{ cursor: "pointer" }}
          onPointerDown={(event) => {
            event.stopPropagation();
            const svg = event.currentTarget.closest("svg")!;
            const rect = svg.getBoundingClientRect();
            const viewBox = svg.viewBox.baseVal;
            const x = event.clientX - rect.left + viewBox.x;
            const y = event.clientY - rect.top + viewBox.y;
            graph.onEdgeClick?.(
              { output: props.output, input: props.input },
              x,
              y,
            );
          }}
        />
      </Show>
      {/* Visible edge line */}
      <line
        pointer-events="none"
        x1={x1()}
        y1={y1()}
        x2={x2()}
        y2={y2()}
        stroke={edgeColor()}
      />
    </Show>
  );
}
