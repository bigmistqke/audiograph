import { ReactiveMap } from "@solid-primitives/map";
import { makePersisted } from "@solid-primitives/storage";
import { createEffect, mapArray, onCleanup, type JSX } from "solid-js";
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

export type AudioFactoryResult<A = undefined> = AudioPorts & { props?: A };

export interface RenderProps<
  S extends Record<string, any> = Record<string, any>,
  A = undefined,
> {
  id: string;
  state: S;
  setState: SetStoreFunction<S>;
  dimensions: { x: number; y: number };
  contentY: number;
  isInputConnected(portName: string): boolean;
  setDimensions(dimensions: Partial<{ x: number; y: number }>): void;
  audio: A | undefined;
}

export interface NodeTypeDef<
  S extends Record<string, any> = Record<string, any>,
  A = undefined,
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
  audio(state: S, nodeId: string, ctx: AudioContext): AudioFactoryResult<A>;
  render(props: RenderProps<S, A>): JSX.Element;
}

export type GraphConfig = Record<string, NodeTypeDef<any, any>>;

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
  options?: { persistName?: string; audioContext?: AudioContext },
) {
  const [graph, setGraph] = options?.persistName
    ? makePersisted(createStore<GraphStore>({ nodes: [], edges: [] }), {
        name: `${options.persistName}-graph`,
      })
    : createStore<GraphStore>({ nodes: [], edges: [] });

  const [allNodeStates, setAllNodeStates] = options?.persistName
    ? makePersisted(createStore<Record<string, Record<string, any>>>({}), {
        name: `${options.persistName}-states`,
      })
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

  // --- Audio lifecycle (only when AudioContext is provided) ---

  const audioData = new ReactiveMap<string, any>();

  if (options?.audioContext) {
    const ctx = options.audioContext;
    const projectedNodes = new ReactiveMap<string, AudioPorts>();

    // Node lifecycle: create audio nodes when graph nodes appear
    const mappedNodes = mapArray(
      () => graph.nodes,
      (node) => {
        const typeDef = config[node.type];
        if (!typeDef?.audio) return;

        const stateEntry = nodeStates.get(node.id);
        const state = stateEntry?.state ?? {};
        const result = typeDef.audio(state, node.id, ctx);

        projectedNodes.set(node.id, { in: result.in, out: result.out });

        if (result.props !== undefined) {
          audioData.set(node.id, result.props);
        }

        onCleanup(() => {
          if (result.out) {
            for (const port of Object.values(result.out)) {
              port.disconnect();
            }
          }
          projectedNodes.delete(node.id);
          audioData.delete(node.id);
        });

        return result;
      },
    );

    createEffect(() => mappedNodes());

    // Edge lifecycle: connect/disconnect audio ports when edges change
    const mappedEdges = mapArray(
      () => graph.edges,
      (edge) => {
        createEffect(() => {
          const from = projectedNodes.get(edge.output.node);
          const to = projectedNodes.get(edge.input.node);

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
    );

    createEffect(() => mappedEdges());
  }

  return {
    config,
    graph,
    nodeStates,
    audioData,
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
            x: snapToGrid(position.x),
            y: snapToGrid(position.y),
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
