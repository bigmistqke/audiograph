import { createContext, useContext } from "solid-js";
import type { createGraph, NodeInstance } from "./lib/create-graph";

export interface TemporaryEdge {
  kind: "in" | "out";
  node: string;
  port: string;
  x?: number;
  y?: number;
}

export type GraphAPI = ReturnType<typeof createGraph<any>>;

export const GraphContext = createContext<{
  graph: GraphAPI;
  setTemporaryEdge(edge: TemporaryEdge | undefined): void;
  getTemporaryEdge(): TemporaryEdge | undefined;
  updateTemporaryEdge(x: number, y: number): void;
  setDragging(dragging: boolean): void;
  getCursorPosition(): { x: number; y: number } | undefined;
}>();

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
