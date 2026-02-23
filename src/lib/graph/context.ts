import { createContext, useContext } from "solid-js";
import type { Edge, EdgeHandle, GraphAPI, NodeInstance } from "./create-graph-api";

export interface TemporaryEdge {
  kind: "in" | "out";
  node: string;
  port: string;
  x?: number;
  y?: number;
}

export interface GhostNode {
  type: string;
  x: number;
  y: number;
  dimensions: { x: number; y: number };
  title: string;
  borderColor: string;
}

export type GraphContextType = GraphAPI & {
  setTemporaryEdge(edge: TemporaryEdge | undefined): void;
  getTemporaryEdge(): TemporaryEdge | undefined;
  updateTemporaryEdge(x: number, y: number): void;
  setDragging(dragging: boolean): void;
  getCursorPosition(): { x: number; y: number } | undefined;
  selectedNodes: string[];
  setSelectedNodes(ids: string[]): void;
  onEdgeClick?(edge: Edge, x: number, y: number): void;
  onEdgeSpliceValidate?(edge: Edge): boolean;
  setGhostNode(ghost: GhostNode | undefined): void;
  getGhostNode(): GhostNode | undefined;
  /**
   * Called when dragging from a port. Returns node type string if a ghost node
   * should be shown (i.e. a node type is selected and port kinds are compatible).
   * Returns undefined to fall through to normal edge dragging.
   */
  onPortDrag?(handle: EdgeHandle, kind: "in" | "out"): string | undefined;
  /**
   * Called when the ghost node drag ends (pointer released).
   * Creates the node at the given position and connects it.
   */
  onPortDragEnd?(handle: EdgeHandle, kind: "in" | "out", x: number, y: number): void;
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
