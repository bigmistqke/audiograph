import { makePersisted } from "@solid-primitives/storage";
import { type JSX } from "solid-js";
import { createStore, produce, type SetStoreFunction } from "solid-js/store";

export interface PortDef {
  name: string;
  [key: string]: unknown;
}

export interface RenderProps<
  S extends Record<string, any> = Record<string, any>,
> {
  id: string;
  state: S;
  setState: SetStoreFunction<S>;
  dimensions: { x: number; y: number };
  isInputConnected(portName: string): boolean;
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
  resizable?: boolean;
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
  output: EdgeHandle;
  input: EdgeHandle;
}

interface GraphStore {
  nodes: NodeInstance[];
  edges: Edge[];
}

export function createGraph<T extends GraphConfig>(
  config: T,
  options?: { persistName?: string },
) {
  const [graph, setGraph] = options?.persistName
    ? makePersisted(
        createStore<GraphStore>({ nodes: [], edges: [] }),
        { name: `${options.persistName}-graph` },
      )
    : createStore<GraphStore>({ nodes: [], edges: [] });

  const [allNodeStates, setAllNodeStates] = options?.persistName
    ? makePersisted(
        createStore<Record<string, Record<string, any>>>({}),
        { name: `${options.persistName}-states` },
      )
    : createStore<Record<string, Record<string, any>>>({});

  // Recover ID counter from persisted nodes
  let nextId = graph.nodes.reduce(
    (max, n) => Math.max(max, (parseInt(n.id) || 0) + 1),
    0,
  );

  const nodeStates = {
    get(
      id: string,
    ): { state: any; setState: SetStoreFunction<any> } | undefined {
      const state = allNodeStates[id];
      if (!state) return undefined;
      return {
        state,
        setState: ((...args: any[]) =>
          (setAllNodeStates as any)(id, ...args)) as SetStoreFunction<any>,
      };
    },
  };

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
      const id = (nextId++).toString();
      const typeDef = config[type];
      const initialState = typeDef.state ? { ...typeDef.state } : {};

      if (!allNodeStates[id]) {
        setAllNodeStates(id, initialState);
      }

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
            (edge) => edge.output.node !== id && edge.input.node !== id,
          );
        }),
      );
      setAllNodeStates(
        produce((states: any) => {
          delete states[id];
        }),
      );
    },
    unlink(output: EdgeHandle, input: EdgeHandle) {
      setGraph(
        "edges",
        produce((edges) => {
          const idx = edges.findIndex(
            (e) =>
              e.output.node === output.node &&
              e.output.port === output.port &&
              e.input.node === input.node &&
              e.input.port === input.port,
          );
          if (idx !== -1) edges.splice(idx, 1);
        }),
      );
    },
    link(output: EdgeHandle, input: EdgeHandle) {
      const exists = graph.edges.find(
        (e) =>
          e.output.node === output.node &&
          e.output.port === output.port &&
          e.input.node === input.node &&
          e.input.port === input.port,
      );
      if (exists) return;

      const fromPort = getPortDef(output.node, output.port);
      const toPort = getPortDef(input.node, input.port);
      if (fromPort?.kind !== toPort?.kind) return;

      setGraph(
        "edges",
        produce((edges) => edges.push({ output, input })),
      );
    },
    updateNode(
      id: string,
      update: Partial<Pick<NodeInstance, "x" | "y" | "type">> & {
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
