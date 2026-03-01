import type { EdgeHandle } from "@audiograph/create-graph";
import { minni } from "@bigmistqke/minni";
import { createSignal } from "solid-js";
import {
  PORT_INSET,
  PORT_RADIUS,
  PORT_SPACING,
  TITLE_HEIGHT,
} from "../constants";
import { useGraph, useNode } from "../context";
import { PortShell } from "./port-shell";
import styles from "./port.module.css";

export function Port(props: {
  name: string;
  index: number;
  kind: "in" | "out";
  dataKind?: string;
  hideLabels?: boolean;
}) {
  const { node } = useNode();
  const graph = useGraph();

  const cx = () => (props.kind === "in" ? PORT_INSET : node.width - PORT_INSET);
  const cy = () => props.index * PORT_SPACING + TITLE_HEIGHT + PORT_RADIUS;

  const [hovered, setHovered] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);

  return (
    <PortShell
      name={props.name}
      index={props.index}
      kind={props.kind}
      width={node.width}
      dataKind={props.dataKind}
      hideLabels={props.hideLabels}
      class={hovered() && !disabled() ? styles.hovered : undefined}
      style={{ cursor: disabled() ? "default" : undefined }}
      onPointerEnter={() => {
        let interactionPrevented = false;
        graph.onPortHover?.({
          handle: { node: node.id, port: props.name },
          kind: props.kind,
          preventDefault: () => {
            interactionPrevented = true;
          },
        });
        setDisabled(interactionPrevented);
        setHovered(true);
      }}
      onPointerLeave={() => {
        graph.onPortHoverEnd?.({
          handle: { node: node.id, port: props.name },
          kind: props.kind,
        });
        setHovered(false);
        setDisabled(false);
      }}
      onPointerUp={(event: PointerEvent) => {
        event.stopPropagation();
        if (disabled()) return;

        const edgeHandle = graph.getTemporaryEdge();

        if (!edgeHandle) return;
        if (edgeHandle.kind === props.kind) return;

        const output: EdgeHandle =
          props.kind === "in"
            ? { node: edgeHandle.nodeId, port: edgeHandle.portId }
            : { node: node.id, port: props.name };

        const input: EdgeHandle =
          props.kind === "out"
            ? { node: edgeHandle.nodeId, port: edgeHandle.portId }
            : { node: node.id, port: props.name };

        graph.addEdge({ output, input });
      }}
      onPointerDown={async (event: PointerEvent) => {
        event.stopPropagation();
        if (disabled()) return;

        let defaultPrevented = false;
        graph.onPortDragStart?.({
          handle: { node: node.id, port: props.name },
          kind: props.kind,
          preventDefault: () => {
            defaultPrevented = true;
          },
        });

        graph.setDragging(true);

        // Detach existing edge from in-port and re-drag from upstream node
        if (!defaultPrevented && props.kind === "in") {
          const existingEdgeEntry = Object.entries(graph.edges).find(
            ([, e]) => e.input.node === node.id && e.input.port === props.name,
          );

          if (existingEdgeEntry) {
            const [edgeId, edge] = existingEdgeEntry;
            graph.deleteEdge(edgeId);
            const fromNode = graph.nodes[edge.output.node];
            if (fromNode) {
              const position = {
                x: node.x + cx(),
                y: node.y + cy(),
              };

              graph.setTemporaryEdge({
                nodeId: fromNode.id,
                kind: "out",
                portId: edge.output.port,
                x: position.x,
                y: position.y,
              });

              await minni(event, (delta) => {
                graph.updateTemporaryEdge(
                  position.x + delta.x,
                  position.y - delta.y,
                );
              });

              graph.setTemporaryEdge(undefined);
              graph.setDragging(false);

              return;
            }
          }
        }

        graph.setTemporaryEdge({
          nodeId: node.id,
          kind: props.kind,
          portId: props.name,
        });
        const position = {
          x: node.x + cx(),
          y: node.y + cy(),
        };

        await minni(event, (delta) => {
          graph.updateTemporaryEdge(position.x + delta.x, position.y - delta.y);
        });

        const cursor = graph.getCursorPosition();
        if (cursor) {
          graph.onPortDragEnd?.({
            handle: { node: node.id, port: props.name },
            kind: props.kind,
            x: cursor.x,
            y: cursor.y,
          });
        }

        if (defaultPrevented) {
          graph.setTemporaryEdge(undefined);
          graph.setDragging(false);
        } else {
          // Wait a frame so that port's onPointerUp
          // can receive the current temporary edge.
          requestAnimationFrame(() => {
            graph.setTemporaryEdge(undefined);
            graph.setDragging(false);
          });
        }
      }}
    />
  );
}
