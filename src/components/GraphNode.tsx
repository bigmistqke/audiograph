import clsx from "clsx";
import { createMemo, Show } from "solid-js";
import styles from "../App.module.css";
import { headerHeight, PORT_OFFSET, PORT_SPACING } from "../constants";
import { NodeContext, useGraph } from "../context";
import type { NodeInstance } from "../lib/create-graph";
import { minni } from "../lib/minni";
import { GraphPort } from "./GraphPort";

export function GraphNode(props: { node: NodeInstance }) {
  const { graph, setDragging } = useGraph();
  const typeDef = () => graph.config[props.node.type];

  const dimensions = () =>
    typeDef()?.resizable
      ? props.node.dimensions
      : (typeDef()?.dimensions ?? props.node.dimensions);

  const borderColor = createMemo(() => {
    const kind = (typeDef()?.ports?.out?.[0]?.kind as string) || "audio";
    return `var(--color-port-${kind})`;
  });

  const maxPorts = () =>
    Math.max(
      typeDef()?.ports?.in?.length ?? 0,
      typeDef()?.ports?.out?.length ?? 0,
    );

  const contentY = () => headerHeight(maxPorts());

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
      >
        {/* HTML node body */}
        <foreignObject
          width={dimensions().x}
          height={dimensions().y}
        >
          <div class={styles.node}>
            <div
              class={styles.nodeHeader}
              style={{ height: `${contentY()}px` }}
            >
              <span class={styles.nodeTitle}>{typeDef()?.title}</span>
              <button
                class={styles.deleteButton}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  graph.deleteNode(props.node.id);
                }}
              />
              {typeDef().ports.in?.map((port: any, index: number) => (
                <span
                  class={clsx(styles.portLabel, styles.portLabelIn)}
                  style={{ top: `${index * PORT_SPACING + PORT_OFFSET}px` }}
                >
                  {port.name}
                </span>
              ))}
              {typeDef().ports.out?.map((port: any, index: number) => (
                <span
                  class={clsx(styles.portLabel, styles.portLabelOut)}
                  style={{ top: `${index * PORT_SPACING + PORT_OFFSET}px` }}
                >
                  {port.name}
                </span>
              ))}
            </div>
            <div class={styles.nodeContent}>
              {rendered()}
            </div>
            <Show when={typeDef().resizable}>
              <div
                class={styles.resizeHandle}
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
            </Show>
          </div>
        </foreignObject>
        {/* SVG ports */}
        {typeDef().ports.in?.map((port: any, index: number) => (
          <GraphPort
            name={port.name}
            index={index}
            kind="in"
            dataKind={port.kind}
          />
        ))}
        {typeDef().ports.out?.map((port: any, index: number) => (
          <GraphPort
            name={port.name}
            index={index}
            kind="out"
            dataKind={port.kind}
          />
        ))}
      </g>
    </NodeContext.Provider>
  );
}
