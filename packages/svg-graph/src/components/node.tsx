import type { Node } from "@audiograph/create-graph";
import { minni } from "@bigmistqke/minni";
import { Show } from "solid-js";
import { snapToGrid } from "../constants";
import { NodeContext, useGraph } from "../context";
import { NodeShell } from "./node-shell";
import styles from "./node.module.css";
import { Port } from "./port";

export function GraphNode(props: { nodeId: string; node: Node }) {
  const graph = useGraph();
  const typeDef = () => graph.config[props.node.type];

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
        width={props.node.width}
        height={props.node.height}
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
                x: graph.nodes[id]!.x,
                y: graph.nodes[id]!.y,
              }));
              graph.setDragging(true);
              await minni(event, (delta) => {
                for (const start of startPositions) {
                  graph.updateNode(start.id, (node) => {
                    node.x = snapToGrid(start.x + delta.x);
                    node.y = snapToGrid(start.y + delta.y);
                  });
                }
              });
              graph.setDragging(false);
            } else {
              const startPos = { x: props.node.x, y: props.node.y };
              graph.setDragging(true);
              await minni(event, (delta) => {
                graph.updateNode(props.node.id, (node) => {
                  node.x = snapToGrid(startPos.x + delta.x);
                  node.y = snapToGrid(startPos.y - delta.y);
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
        {graph.constructResults[props.node.id]?.render?.()}
        <Show when={typeDef().resizable}>
          <div
            class={
              typeDef().resizable === "y"
                ? styles.resizeHandleY
                : styles.resizeHandle
            }
            onPointerDown={async (event) => {
              event.stopPropagation();
              const startDims = {
                width: props.node.width,
                height: props.node.height,
              };
              graph.setDragging(true);
              await minni(event, (delta) => {
                graph.updateNode(props.node.id, (node) => {
                  if (typeDef().resizable !== "y") {
                    node.width = Math.max(
                      80,
                      snapToGrid(startDims.width + delta.x),
                    );
                  }
                  node.height = Math.max(
                    60,
                    snapToGrid(startDims.height - delta.y),
                  );
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
