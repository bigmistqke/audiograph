import { createMemo } from "solid-js";
import styles from "../App.module.css";
import { PORT_OFFSET, PORT_RADIUS, PORT_SPACING } from "../constants";
import { NodeContext, useGraph } from "../context";
import type { NodeInstance } from "../lib/create-graph";
import { minni } from "../lib/minni";
import { GraphPort } from "./GraphPort";

export function GraphNode(props: { node: NodeInstance }) {
  const { graph, setDragging } = useGraph();
  const typeDef = () => graph.config[props.node.type];

  const dimensions = () =>
    typeDef()?.resizable ? props.node.dimensions : typeDef()?.dimensions ?? props.node.dimensions;

  const borderColor = createMemo(() => {
    const kind = (typeDef()?.ports?.out?.[0]?.kind as string) || "audio";
    return `var(--color-port-${kind})`;
  });

  const maxPorts = () =>
    Math.max(
      typeDef()?.ports?.in?.length ?? 0,
      typeDef()?.ports?.out?.length ?? 0,
    );

  const contentY = () =>
    maxPorts() > 0
      ? PORT_OFFSET + (maxPorts() - 1) * PORT_SPACING + PORT_RADIUS + 5
      : PORT_OFFSET;

  const rendered = () => {
    const def = typeDef();
    if (!def?.render) return null;
    const entry = graph.nodeStates.get(props.node.id);
    return def.render({
      id: props.node.id,
      state: entry?.state,
      setState: entry?.setState,
      dimensions: dimensions(),
      contentY: contentY(),
      setDimensions: (dims: Partial<{ x: number; y: number }>) =>
        graph.updateNode(props.node.id, { dimensions: dims }),
      isInputConnected: (portName: string) =>
        graph.graph.edges.some(
          (e) => e.input.node === props.node.id && e.input.port === portName,
        ),
    });
  };

  return (
    <NodeContext.Provider
      value={{
        node: props.node,
        get typeDef() {
          return typeDef();
        },
      }}
    >
      <g
        transform={`translate(${props.node.x}, ${props.node.y})`}
        style={{ "--color-node": borderColor() }}
        onPointerDown={async (event) => {
          if (event.target.closest("[data-pointerevents-block=true]")) {
            return;
          }
          console.log("this happens");
          const startPos = { x: props.node.x, y: props.node.y };
          setDragging(true);
          await minni(event, (delta) => {
            graph.updateNode(props.node.id, {
              x: startPos.x + delta.x,
              y: startPos.y - delta.y,
            });
          });
          console.log("but this never happens?");
          setDragging(false);
        }}
      >
        <rect
          class={styles.nodeRect}
          width={dimensions().x}
          height={dimensions().y}
        />
        {rendered()}
        <g transform={`translate(${dimensions().x - 20}, 5)`}>
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
        {typeDef().ports.in?.map((port: any, index: number) => (
          <>
            <GraphPort
              name={port.name}
              index={index}
              kind="in"
              dataKind={port.kind}
            />
            <text
              x={PORT_RADIUS + 8}
              y={index * PORT_SPACING + PORT_OFFSET}
              text-anchor="start"
              dominant-baseline="middle"
              class={styles.portLabel}
            >
              {port.name}
            </text>
          </>
        ))}
        {typeDef().ports.out?.map((port: any, index: number) => (
          <>
            <GraphPort
              name={port.name}
              index={index}
              kind="out"
              dataKind={port.kind}
            />
            <text
              x={dimensions().x - PORT_RADIUS - 8}
              y={index * PORT_SPACING + PORT_OFFSET}
              text-anchor="end"
              dominant-baseline="middle"
              class={styles.portLabel}
            >
              {port.name}
            </text>
          </>
        ))}
        {typeDef().resizable && (
          <>
            <polygon
              points={`${dimensions().x},${dimensions().y - 10} ${dimensions().x},${dimensions().y} ${dimensions().x - 10},${dimensions().y}`}
              fill="transparent"
              stroke="none"
              style={{ cursor: "nwse-resize" }}
              onPointerDown={async (event) => {
                event.stopPropagation();
                const startDims = { ...props.node.dimensions };
                setDragging(true);
                await minni(event, (delta) => {
                  graph.updateNode(props.node.id, {
                    dimensions: {
                      x: Math.max(80, startDims.x + delta.x),
                      y: Math.max(60, startDims.y - delta.y),
                    },
                  });
                });
                setDragging(false);
              }}
            />
            <line
              x1={dimensions().x}
              y1={dimensions().y - 10}
              x2={dimensions().x - 10}
              y2={dimensions().y}
              stroke="var(--color-stroke)"
              stroke-width="1.5"
              pointer-events="none"
            />
          </>
        )}
      </g>
    </NodeContext.Provider>
  );
}
