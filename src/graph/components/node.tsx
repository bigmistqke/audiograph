import { minni } from "@bigmistqke/minni";
import { createMemo, Show } from "solid-js";
import { headerHeight, snapToGrid } from "../constants";
import { NodeContext, useGraph } from "../context";
import type { NodeInstance } from "../create-graph";
import styles from "./node.module.css";
import { GraphPort } from "./port";

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
    return graph.nodes[props.node.id].ui?.();
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
      >
        {/* HTML node body */}
        <foreignObject width={dimensions().x} height={dimensions().y}>
          <div class={styles.node}>
            <div
              class={styles.nodeHeader}
              style={{ height: `${contentY()}px` }}
              onPointerDown={async (event) => {
                if (event.target.closest("[data-pointerevents-block=true]")) {
                  return;
                }
                const startPos = { x: props.node.x, y: props.node.y };
                setDragging(true);
                await minni(event, (delta) => {
                  graph.updateNode(props.node.id, {
                    x: snapToGrid(startPos.x + delta.x),
                    y: snapToGrid(startPos.y - delta.y),
                  });
                });
                setDragging(false);
              }}
            >
              <div class={styles.nodeTitle}>{typeDef()?.title}</div>
              <button
                class={styles.deleteButton}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  graph.deleteNode(props.node.id);
                }}
              />
            </div>
            {rendered()}
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
                        x: Math.max(80, snapToGrid(startDims.x + delta.x)),
                        y: Math.max(60, snapToGrid(startDims.y - delta.y)),
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
            hideLabels={typeDef()?.hideLabels}
          />
        ))}
        {typeDef().ports.out?.map((port: any, index: number) => (
          <GraphPort
            name={port.name}
            index={index}
            kind="out"
            dataKind={port.kind}
            hideLabels={typeDef()?.hideLabels}
          />
        ))}
      </g>
    </NodeContext.Provider>
  );
}
