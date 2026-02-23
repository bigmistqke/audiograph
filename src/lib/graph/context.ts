import { createContext, useContext } from "solid-js";
import type {
  Edge,
  EdgeHandle,
  GraphAPI,
  NodeInstance,
} from "./create-graph-api";

export interface TemporaryEdge {
  kind: "in" | "out";
  node: string;
  port: string;
  x?: number;
  y?: number;
}

export type GraphContextType = GraphAPI & {
  setTemporaryEdge(edge: TemporaryEdge | undefined): void;
  getTemporaryEdge(): TemporaryEdge | undefined;
  updateTemporaryEdge(x: number, y: number): void;
  setDragging(dragging: boolean): void;
  getCursorPosition(): { x: number; y: number } | undefined;
  selectedNodes: string[];
  setSelectedNodes(ids: string[]): void;
  /** Called when pointer down on a node header. Call preventDefault() to block normal drag. */
  onNodePointerDown?(event: {
    node: NodeInstance;
    nativeEvent: PointerEvent;
    preventDefault(): void;
  }): void;
  onEdgeClick?(event: { edge: Edge; x: number; y: number }): void;
  onEdgeSpliceValidate?(event: { edge: Edge }): boolean;
  /** Called when pointer enters a port. Call preventDefault() to disable all port interaction. */
  onPortHover?(event: {
    handle: EdgeHandle;
    kind: "in" | "out";
    preventDefault(): void;
  }): void;
  /** Called when pointer leaves a port. */
  onPortHoverEnd?(event: { handle: EdgeHandle; kind: "in" | "out" }): void;
  /** Called when dragging from a port. */
  onPortDragStart?(event: {
    handle: EdgeHandle;
    kind: "in" | "out";
    preventDefault(): void;
  }): void;
  /** Called when cursor enters/leaves a spliceable edge. */
  onEdgeHover?(event: { edge: Edge } | undefined): void;
  /** Called when port drag ends (pointer released). */
  onPortDragEnd?(event: {
    handle: EdgeHandle;
    kind: "in" | "out";
    x: number;
    y: number;
  }): void;
};

export const GraphContext = createContext<GraphContextType>();

export function useGraph() {
  const context = useContext(GraphContext);
  if (!context) throw new Error("useGraph must be used within GraphContext");
  return context;
}

export const NodeContext = createContext<{
  node: NodeInstance;
  typeDef: any;
}>();

export function useNode() {
  const context = useContext(NodeContext);
  if (!context) throw new Error("useNode must be used within a Node");
  return context;
}
