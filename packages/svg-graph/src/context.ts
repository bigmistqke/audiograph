import type {
  Edge,
  EdgeHandle,
  GraphAPI,
  Node,
  NodeDefinition,
} from "@audiograph/create-graph";
import { createContext, useContext } from "solid-js";

export interface TemporaryEdge {
  kind: "in" | "out";
  nodeId: string;
  portId: string;
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
    node: Node;
    nativeEvent: PointerEvent;
    preventDefault(): void;
  }): void;
  onEdgeClick?(event: {
    edgeId: string;
    edge: Edge;
    x: number;
    y: number;
  }): void;
  onEdgeSpliceValidate?(event: { edgeId: string; edge: Edge }): boolean;
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
  onEdgeHover?(event: { edgeId: string | undefined }): void;
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
  node: Node;
  typeDef: NodeDefinition;
}>();

export function useNode() {
  const context = useContext(NodeContext);
  if (!context) throw new Error("useNode must be used within a Node");
  return context;
}
