import { minni } from "@bigmistqke/minni";
import { createMemo, Show } from "solid-js";
import { headerHeight, snapToGrid } from "../constants";
import { NodeContext, useGraph } from "../context";
import type { NodeInstance } from "../create-graph-api";
import styles from "./node.module.css";
import { GraphPort } from "./port";

export function GraphNode(props: { node: NodeInstance }) {
  const graph = useGraph();
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
          <div
            class={styles.node}
            data-selected={
              graph.selectedNodes.includes(props.node.id) || undefined
            }
          >
            <div
              class={styles.nodeHeader}
              style={{ height: `${contentY()}px` }}
              onPointerDown={async (event) => {
                if (event.target.closest("[data-pointerevents-block=true]")) {
                  return;
                }

                const isSelected = graph.selectedNodes.includes(props.node.id);

                if (!isSelected) {
                  // Clicking an unselected node: clear multi-selection, drag only this node
                  graph.setSelectedNodes([]);
                }

                if (isSelected && graph.selectedNodes.length > 1) {
                  // Drag all selected nodes together
                  const startPositions = graph.selectedNodes.map((id) => ({
                    id,
                    x: graph.graphStore.nodes[id]!.x,
                    y: graph.graphStore.nodes[id]!.y,
                  }));
                  graph.setDragging(true);
                  await minni(event, (delta) => {
                    for (const start of startPositions) {
                      graph.updateNode(start.id, {
                        x: snapToGrid(start.x + delta.x),
                        y: snapToGrid(start.y - delta.y),
                      });
                    }
                  });
                  graph.setDragging(false);
                } else {
                  // Drag single node
                  const startPos = { x: props.node.x, y: props.node.y };
                  graph.setDragging(true);
                  await minni(event, (delta) => {
                    graph.updateNode(props.node.id, {
                      x: snapToGrid(startPos.x + delta.x),
                      y: snapToGrid(startPos.y - delta.y),
                    });
                  });
                  graph.setDragging(false);
                }
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
            {graph.nodes[props.node.id].render?.()}
            <Show when={typeDef().resizable}>
              <div
                class={styles.resizeHandle}
                onPointerDown={async (event) => {
                  event.stopPropagation();
                  const startDims = { ...props.node.dimensions };
                  graph.setDragging(true);
                  await minni(event, (delta) => {
                    graph.updateNode(props.node.id, {
                      dimensions: {
                        x: Math.max(80, snapToGrid(startDims.x + delta.x)),
                        y: Math.max(60, snapToGrid(startDims.y - delta.y)),
                      },
                    });
                  });
                  graph.setDragging(false);
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
