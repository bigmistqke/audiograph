import { createContext, useContext } from "solid-js";
import type { GraphAPI, NodeInstance } from "./create-graph-api";

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
