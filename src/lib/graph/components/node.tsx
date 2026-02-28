import { minni } from "@bigmistqke/minni";
import { Show } from "solid-js";
import { snapToGrid } from "../constants";
import { NodeContext, useGraph } from "../context";
import type { NodeInstance } from "../create-graph-api";
import { NodeShell } from "./node-shell";
import styles from "./node.module.css";
import { Port } from "./port";

export function GraphNode(props: { node: NodeInstance }) {
  const graph = useGraph();
  const typeDef = () => graph.config[props.node.type];

  const dimensions = () => props.node.dimensions ?? typeDef()?.dimensions;

  const borderColor = () => {
    const kind = (typeDef()?.ports?.out?.[0]?.kind as string) || "audio";
    return `var(--color-port-${kind})`;
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
      <NodeShell
        x={props.node.x}
        y={props.node.y}
        dimensions={dimensions()}
        title={typeDef()?.title ?? ""}
        borderColor={borderColor()}
        ports={typeDef()?.ports}
        hideLabels={typeDef()?.hideLabels}
        selected={graph.selectedNodes.includes(props.node.id)}
        headerProps={{
          onPointerDown: async (event: PointerEvent) => {
            if (
              (event.target as HTMLElement).closest(
                "[data-pointerevents-block=true]",
              )
            ) {
              return;
            }

            let defaultPrevented = false;
            graph.onNodePointerDown?.({
              node: props.node,
              nativeEvent: event,
              preventDefault: () => {
                defaultPrevented = true;
              },
            });
            if (defaultPrevented) return;

            const isSelected = graph.selectedNodes.includes(props.node.id);

            if (!isSelected) {
              graph.setSelectedNodes([]);
            }

            if (isSelected && graph.selectedNodes.length > 1) {
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
          },
        }}
        headerChildren={
          <button
            class={styles.deleteButton}
            onPointerDown={(event) => {
              event.stopPropagation();
              graph.deleteNode(props.node.id);
            }}
          />
        }
        portSlot={
          <>
            {typeDef().ports.in?.map((port: any, index: number) => (
              <Port
                name={port.name}
                index={index}
                kind="in"
                dataKind={port.kind}
                hideLabels={typeDef()?.hideLabels}
              />
            ))}
            {typeDef().ports.out?.map((port: any, index: number) => (
              <Port
                name={port.name}
                index={index}
                kind="out"
                dataKind={port.kind}
                hideLabels={typeDef()?.hideLabels}
              />
            ))}
          </>
        }
      >
        {graph.nodes[props.node.id]?.render?.()}
        <Show when={typeDef().resizable}>
          <div
            class={typeDef().resizable === "y" ? styles.resizeHandleY : styles.resizeHandle}
            onPointerDown={async (event) => {
              event.stopPropagation();
              const startDims = { ...props.node.dimensions };
              graph.setDragging(true);
              await minni(event, (delta) => {
                graph.updateNode(props.node.id, {
                  dimensions:
                    typeDef().resizable === "y"
                      ? { x: startDims.x, y: Math.max(60, snapToGrid(startDims.y - delta.y)) }
                      : { x: Math.max(80, snapToGrid(startDims.x + delta.x)), y: Math.max(60, snapToGrid(startDims.y - delta.y)) },
                });
              });
              graph.setDragging(false);
            }}
          />
        </Show>
      </NodeShell>
    </NodeContext.Provider>
  );
}
