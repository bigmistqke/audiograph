import {
  createComputed,
  createEffect,
  mapArray,
  onCleanup,
  type JSX,
} from "solid-js";
import { createStore, produce, type SetStoreFunction } from "solid-js/store";
import { snapToGrid } from "../constants";

export interface PortDef {
  name: string;
  [key: string]: unknown;
}

interface Connectable {
  connect(target: any): any;
  disconnect(target?: any): void;
}

interface AudioPorts {
  in?: Record<string, AudioNode | AudioParam>;
  out?: Record<string, Connectable>;
}

export interface ConstructProps<
  S extends Record<string, any> = Record<string, any>,
  C = any,
> {
  id: string;
  ctx: C;
  state: S;
  setState: SetStoreFunction<NoInfer<S>>;
  isInputConnected(portName: string): boolean;
}

export interface ConstructResult {
  in?: Record<string, AudioNode | AudioParam>;
  out?: Record<string, Connectable>;
  ui?: () => JSX.Element;
}

export interface NodeTypeDef<
  S extends Record<string, any> = Record<string, any>,
  C = any,
> {
  title?: string;
  dimensions: { x: number; y: number };
  ports: {
    in?: PortDef[];
    out?: PortDef[];
  };
  state?: S;
  resizable?: boolean;
  hideLabels?: boolean;
  construct(props: ConstructProps<S, C>): ConstructResult;
}

export type GraphConfig<C = any> = Record<string, NodeTypeDef<any, C>>;

export interface NodeInstance<
  S extends Record<string, any> = Record<string, any>,
> {
  id: string;
  type: string;
  x: number;
  y: number;
  dimensions: { x: number; y: number };
  state?: S;
}

export interface EdgeHandle {
  node: string;
  port: string;
}

export interface Edge {
  output: EdgeHandle;
  input: EdgeHandle;
}

export interface GraphStore {
  nodes: Record<string, NodeInstance>;
  edges: Edge[];
}

export function createGraph<C, T extends GraphConfig<C>>({
  config,
  context,
  store: store,
  setStore: setStore,
}: {
  config: T;
  context: C;
  store: GraphStore;
  setStore: SetStoreFunction<GraphStore>;
}) {
  // Recover ID counter from persisted nodes
  let nextId = Object.keys(store.nodes).reduce(
    (max, n) => Math.max(max, (parseInt(n) || 0) + 1),
    0,
  );

  function getPortDef(nodeId: string, portName: string) {
    const node = store.nodes[nodeId];
    if (!node) return undefined;
    const typeDef = config[node.type];
    return (
      typeDef.ports.in?.find((p: PortDef) => p.name === portName) ??
      typeDef.ports.out?.find((p: PortDef) => p.name === portName)
    );
  }
  const [nodes, setNodes] = createStore<Record<string, ConstructResult>>({});

  createComputed(
    mapArray(
      () => Object.keys(store.nodes),
      (id) => {
        createComputed(() => {
          const node = store.nodes[id];
          const typeDef = config[node.type];

          if (!typeDef?.construct) {
            throw new Error(
              `Expected ${node.type} to be defined in the graph-config. Valid node-kinds: ${Object.keys(config)}`,
            );
          }

          setNodes(
            id,
            typeDef.construct({
              id: node.id,
              ctx: context,
              get state() {
                return node.state;
              },
              setState(...args: any[]) {
                return (setStore as any)("nodes", id, "state", ...args);
              },
              isInputConnected: (portName: string) =>
                store.edges.some(
                  (e) => e.input.node === node.id && e.input.port === portName,
                ),
            }),
          );
        });
      },
    ),
  );

  // Edge lifecycle: connect/disconnect audio ports when edges change
  createEffect(
    mapArray(
      () => store.edges,
      (edge) => {
        createEffect(() => {
          const from = nodes[edge.output.node];
          const to = nodes[edge.input.node];

          if (!from || !to) return;

          const outPort = from.out?.[edge.output.port];
          const inPort = to.in?.[edge.input.port];

          if (!outPort || !inPort) return;

          // When connecting to an AudioParam, zero its intrinsic value
          // so only the connected signal controls it (connections are additive)
          let savedValue: number | undefined;
          if (inPort instanceof AudioParam) {
            savedValue = inPort.value;
            inPort.value = 0;
          }

          outPort.connect(inPort);
          onCleanup(() => {
            outPort.disconnect(inPort);
            if (inPort instanceof AudioParam && savedValue !== undefined) {
              inPort.value = savedValue;
            }
          });
        });
      },
    ),
  );

  return {
    config,
    store,
    nodes,
    getPortDef,
    addNode(type: keyof T & string, position: { x: number; y: number }) {
      const id = (nextId++).toString();
      const typeDef = config[type];

      setStore(
        "nodes",
        produce((nodes) => {
          nodes[id] = {
            id,
            type,
            x: snapToGrid(position.x),
            y: snapToGrid(position.y),
            dimensions: { ...typeDef.dimensions },
            state: config[type]?.state,
          };
        }),
      );

      return id;
    },
    deleteNode(id: string) {
      setStore(
        produce((graph) => {
          delete graph.nodes[id];
          graph.edges = graph.edges.filter(
            (edge) => edge.output.node !== id && edge.input.node !== id,
          );
        }),
      );
    },
    unlink(output: EdgeHandle, input: EdgeHandle) {
      setStore(
        "edges",
        produce((edges) => {
          const index = edges.findIndex(
            (e) =>
              e.output.node === output.node &&
              e.output.port === output.port &&
              e.input.node === input.node &&
              e.input.port === input.port,
          );
          if (index !== -1) edges.splice(index, 1);
        }),
      );
    },
    link(output: EdgeHandle, input: EdgeHandle) {
      const exists = store.edges.find(
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

      setStore(
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
      setStore(
        "nodes",
        produce((nodes) => {
          const { dimensions, ...rest } = update;
          Object.assign(nodes[id], rest);
          if (dimensions) Object.assign(nodes[id].dimensions, dimensions);
        }),
      );
    },
  };
}
