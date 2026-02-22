import {
  createComputed,
  createEffect,
  mapArray,
  onCleanup,
  type JSX,
} from "solid-js";
import { createStore, produce, type SetStoreFunction } from "solid-js/store";
import { snapToGrid } from "./constants";

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
  context: C;
  state: S;
  setState: SetStoreFunction<NoInfer<S>>;
  isInputConnected(portName: string): boolean;
  graph: GraphStore;
  setGraph: SetStoreFunction<GraphStore>;
}

export interface ConstructResult {
  in?: Record<string, AudioNode | AudioParam>;
  out?: Record<string, Connectable>;
  ui?: () => JSX.Element;
}

export interface NodeTypeDef<
  TState extends Record<string, any> = Record<string, any>,
  TContext = any,
> {
  title?: string;
  dimensions: { x: number; y: number };
  ports: {
    in?: PortDef[];
    out?: PortDef[];
  };
  state?: TState;
  resizable?: boolean;
  hideLabels?: boolean;
  construct(props: ConstructProps<TState, TContext>): ConstructResult;
}

export type GraphConfig<TContext = any> = Record<
  string,
  NodeTypeDef<any, TContext>
>;

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

export type GraphAPI<
  TConfig extends GraphConfig<unknown> = GraphConfig<unknown>,
> = {
  config: TConfig;
  nodes: Record<string, ConstructResult>;
  getPortDef: (nodeId: string, portName: string) => PortDef | undefined;
  addNode(
    type: keyof TConfig & string,
    position: {
      x: number;
      y: number;
    },
  ): string;
  deleteNode(id: string): void;
  unlink(output: EdgeHandle, input: EdgeHandle): void;
  link(output: EdgeHandle, input: EdgeHandle): void;
  updateNode(
    id: string,
    update: Partial<Pick<NodeInstance, "x" | "y" | "type">> & {
      dimensions?: Partial<{
        x: number;
        y: number;
      }>;
    },
  ): void;
};

export interface CreateGraphAPIConfig<
  TContext,
  TConfig extends GraphConfig<TContext>,
> {
  config: TConfig;
  context: TContext;
  graphStore: GraphStore;
  setGraphStore: SetStoreFunction<GraphStore>;
}

export function createGraphAPI<
  TContext,
  TConfig extends GraphConfig<TContext>,
>({
  config,
  context,
  graphStore,
  setGraphStore,
}: CreateGraphAPIConfig<TContext, TConfig>): GraphAPI<TConfig> {
  const [nodes, setNodes] = createStore<Record<string, ConstructResult>>({});

  // Recover ID counter from persisted nodes
  let nextId = Object.keys(graphStore.nodes).reduce(
    (max, n) => Math.max(max, (parseInt(n) || 0) + 1),
    0,
  );

  function getPortDef(nodeId: string, portName: string) {
    const node = graphStore.nodes[nodeId];
    if (!node) return undefined;
    const typeDef = config[node.type];
    return (
      typeDef.ports.in?.find((p: PortDef) => p.name === portName) ??
      typeDef.ports.out?.find((p: PortDef) => p.name === portName)
    );
  }

  createComputed(
    mapArray(
      () => Object.keys(graphStore.nodes),
      (id) => {
        createComputed(() => {
          const node = graphStore.nodes[id];
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
              context,
              graph: graphStore,
              setGraph: setGraphStore,
              get state() {
                return node.state;
              },
              setState(...args: any[]) {
                return (setGraphStore as any)("nodes", id, "state", ...args);
              },
              isInputConnected: (portName: string) =>
                graphStore.edges.some(
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
      () => graphStore.edges,
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
    nodes,
    getPortDef,
    addNode(type: keyof TConfig & string, position: { x: number; y: number }) {
      const id = (nextId++).toString();
      const typeDef = config[type];

      setGraphStore(
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
      setGraphStore(
        produce((graph) => {
          delete graph.nodes[id];
          graph.edges = graph.edges.filter(
            (edge) => edge.output.node !== id && edge.input.node !== id,
          );
        }),
      );
    },
    unlink(output: EdgeHandle, input: EdgeHandle) {
      setGraphStore(
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
      const exists = graphStore.edges.find(
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

      setGraphStore(
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
      setGraphStore(
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
