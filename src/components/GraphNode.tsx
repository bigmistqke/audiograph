import { minni } from "@bigmistqke/minni";
import { createMemo } from "solid-js";
import styles from "../App.module.css";
import { PORT_OFFSET, PORT_SPACING } from "../constants";
import { NodeContext, useGraph } from "../context";
import type { NodeInstance } from "../lib/create-graph";
import { GraphPort } from "./GraphPort";

const PROXIMITY_THRESHOLD = 60;

export function GraphNode(props: { node: NodeInstance }) {
  const { graph, setDragging, getCursorPosition } = useGraph();
  const typeDef = graph.config[props.node.type];

  const isNearby = createMemo(() => {
    const cursor = getCursorPosition();
    if (!cursor) return false;
    const nx = props.node.x;
    const ny = props.node.y;
    const nw = props.node.dimensions.x;
    const nh = props.node.dimensions.y;
    const dx = Math.max(nx - cursor.x, 0, cursor.x - (nx + nw));
    const dy = Math.max(ny - cursor.y, 0, cursor.y - (ny + nh));
    return Math.sqrt(dx * dx + dy * dy) < PROXIMITY_THRESHOLD;
  });

  const rendered = () => {
    if (!typeDef.render) return null;
    const entry = graph.nodeStates.get(props.node.id);
    return typeDef.render({
      state: entry?.state,
      setState: entry?.setState,
      dimensions: props.node.dimensions,
      setDimensions: (dims: Partial<{ x: number; y: number }>) =>
        graph.updateNode(props.node.id, { dimensions: dims }),
      isInputConnected: (portName: string) =>
        graph.graph.edges.some(
          (e) => e.input.node === props.node.id && e.input.port === portName,
        ),
    });
  };

  return (
    <NodeContext.Provider value={{ node: props.node, typeDef }}>
      <g transform={`translate(${props.node.x}, ${props.node.y})`}>
        <rect
          fill="white"
          stroke="black"
          width={props.node.dimensions.x}
          height={props.node.dimensions.y}
          onPointerDown={async (event) => {
            const startPos = { x: props.node.x, y: props.node.y };
            setDragging(true);
            await minni(event, (delta) => {
              graph.updateNode(props.node.id, {
                x: startPos.x + delta.x,
                y: startPos.y - delta.y,
              });
            });
            setDragging(false);
          }}
        />
        {rendered()}
        <g transform={`translate(${props.node.dimensions.x - 20}, 5)`}>
          <foreignObject width="15" height="15">
            <button
              class={styles.deleteButton}
              onPointerDown={(event) => {
                event.stopPropagation();
                graph.deleteNode(props.node.id);
              }}
            ></button>
          </foreignObject>
        </g>
        {typeDef.ports.in.map((port: any, index: number) => (
          <GraphPort
            name={port.name}
            index={index}
            kind="in"
            dataKind={port.kind}
          />
        ))}
        {typeDef.ports.out.map((port: any, index: number) => (
          <GraphPort
            name={port.name}
            index={index}
            kind="out"
            dataKind={port.kind}
          />
        ))}
        <g
          class={styles.portLabels}
          data-visible={isNearby() || undefined}
        >
          {typeDef.ports.in.map((port: any, index: number) => (
            <text
              x={-8}
              y={index * PORT_SPACING + PORT_OFFSET}
              text-anchor="end"
              dominant-baseline="middle"
              class={styles.portLabel}
            >
              {port.name}
            </text>
          ))}
          {typeDef.ports.out.map((port: any, index: number) => (
            <text
              x={props.node.dimensions.x + 8}
              y={index * PORT_SPACING + PORT_OFFSET}
              text-anchor="start"
              dominant-baseline="middle"
              class={styles.portLabel}
            >
              {port.name}
            </text>
          ))}
        </g>
      </g>
    </NodeContext.Provider>
  );
}
