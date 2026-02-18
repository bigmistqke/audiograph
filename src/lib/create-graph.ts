import { ReactiveMap } from "@solid-primitives/map";
import { type JSX } from "solid-js";
import { createStore, produce, type SetStoreFunction } from "solid-js/store";

export interface PortDef {
  name: string;
  [key: string]: unknown;
}

export interface RenderProps<
  S extends Record<string, any> = Record<string, any>,
> {
  state: S;
  setState: SetStoreFunction<S>;
  dimensions: { x: number; y: number };
  setDimensions(dimensions: Partial<{ x: number; y: number }>): void;
}

export interface NodeTypeDef<
  S extends Record<string, any> = Record<string, any>,
> {
  dimensions: { x: number; y: number };
  ports: {
    in?: PortDef[];
    out?: PortDef[];
  };
  state?: S;
  render?: (props: RenderProps<S>) => JSX.Element;
}

export type GraphConfig = Record<string, NodeTypeDef<any>>;

export interface NodeInstance {
  id: string;
  type: string;
  x: number;
  y: number;
  dimensions: { x: number; y: number };
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

  function getPortDef(nodeId: string, portName: string) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return undefined;
    const typeDef = config[node.type];
    return (
      typeDef.ports.in?.find((p) => p.name === portName) ??
      typeDef.ports.out?.find((p) => p.name === portName)
    );
  }

  return {
    config,
    graph,
    nodeStates,
    getPortDef,
    addNode(type: keyof T & string, position: { x: number; y: number }) {
      const id = (ID++).toString();
      const typeDef = config[type];
      const initialState = typeDef.state ? { ...typeDef.state } : {};
      const [state, setState] = createStore(initialState);
      nodeStates.set(id, { state, setState });

      setGraph(
        "nodes",
        produce((nodes) => {
          nodes.push({
            id,
            type,
            x: position.x,
            y: position.y,
            dimensions: { ...typeDef.dimensions },
          });
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
    unlink(from: EdgeHandle, to: EdgeHandle) {
      setGraph(
        "edges",
        produce((edges) => {
          const idx = edges.findIndex(
            (e) =>
              e.from.node === from.node &&
              e.from.port === from.port &&
              e.to.node === to.node &&
              e.to.port === to.port,
          );
          if (idx !== -1) edges.splice(idx, 1);
        }),
      );
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

      const fromPort = getPortDef(from.node, from.port);
      const toPort = getPortDef(to.node, to.port);
      if (fromPort?.kind !== toPort?.kind) return;

      setGraph(
        "edges",
        produce((edges) => edges.push({ from, to })),
      );
    },
    updateNode(
      id: string,
      update: Partial<Pick<NodeInstance, "x" | "y">> & {
        dimensions?: Partial<{ x: number; y: number }>;
      },
    ) {
      setGraph(
        "nodes",
        produce((nodes) => {
          const idx = nodes.findIndex((n) => n.id === id);
          if (idx === -1) return;
          const { dimensions, ...rest } = update;
          Object.assign(nodes[idx], rest);
          if (dimensions) Object.assign(nodes[idx].dimensions, dimensions);
        }),
      );
    },
  };
}
