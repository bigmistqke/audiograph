import { type JSX } from "solid-js";
import { createStore, produce, type SetStoreFunction } from "solid-js/store";
import { ReactiveMap } from "@solid-primitives/map";

export interface PortDef {
  name: string;
  [key: string]: unknown;
}

export interface NodeTypeDef<S extends Record<string, any> = Record<string, any>> {
  dimensions: { x: number; y: number };
  ports: {
    in: PortDef[];
    out: PortDef[];
  };
  state?: S;
  render?: (state: S, setState: SetStoreFunction<S>) => JSX.Element;
}

export type GraphConfig = Record<string, NodeTypeDef<any>>;

export interface NodeInstance {
  id: string;
  type: string;
  x: number;
  y: number;
}

export interface EdgeHandle {
  node: string;
  port: string;
}

export interface Edge {
  from: EdgeHandle;
  to: EdgeHandle;
}

interface GraphStore {
  nodes: NodeInstance[];
  edges: Edge[];
}

let ID = 0;

export function createGraph<T extends GraphConfig>(config: T) {
  const [graph, setGraph] = createStore<GraphStore>({ nodes: [], edges: [] });
  const nodeStates = new ReactiveMap<
    string,
    { state: any; setState: SetStoreFunction<any> }
  >();

  return {
    config,
    graph,
    nodeStates,
    addNode(type: keyof T & string, position: { x: number; y: number }) {
      const id = (ID++).toString();
      const typeDef = config[type];
      const initialState = typeDef.state ? { ...typeDef.state } : {};
      const [state, setState] = createStore(initialState);
      nodeStates.set(id, { state, setState });

      setGraph(
        "nodes",
        produce((nodes) => {
          nodes.push({ id, type, x: position.x, y: position.y });
        }),
      );

      return id;
    },
    deleteNode(id: string) {
      setGraph(
        produce((graph) => {
          const idx = graph.nodes.findIndex((node) => node.id === id);
          if (idx !== -1) graph.nodes.splice(idx, 1);
          graph.edges = graph.edges.filter(
            (edge) => edge.from.node !== id && edge.to.node !== id,
          );
        }),
      );
      nodeStates.delete(id);
    },
    link(from: EdgeHandle, to: EdgeHandle) {
      const exists = graph.edges.find(
        (e) =>
          e.from.node === from.node &&
          e.from.port === from.port &&
          e.to.node === to.node &&
          e.to.port === to.port,
      );
      if (exists) return;
      setGraph(
        "edges",
        produce((edges) => edges.push({ from, to })),
      );
    },
    updateNode(id: string, update: Partial<Pick<NodeInstance, "x" | "y">>) {
      setGraph(
        "nodes",
        produce((nodes) => {
          const idx = nodes.findIndex((n) => n.id === id);
          if (idx !== -1) Object.assign(nodes[idx], update);
        }),
      );
    },
  };
}
