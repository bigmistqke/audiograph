import { assertedNotNullish, pickProps } from "@audiograph/utils";
import {
  batch,
  createComputed,
  createEffect,
  mapArray,
  mergeProps,
  onCleanup,
} from "solid-js";
import { createStore } from "solid-js/store";
import type {
  ConstructResult,
  CreateGraphAPIConfig,
  GraphAPI,
  GraphConfig,
  InferStateFromGraphConfig,
  PortDefinition,
} from "./types";

export function createGraph<TConfig extends GraphConfig>(
  graphOptions: CreateGraphAPIConfig<TConfig>,
): GraphAPI<TConfig> {
  const [constructResults, setConstructResults] = createStore<
    Record<string, ConstructResult>
  >({});

  function getPortDef(nodeId: string, portName: string) {
    const node = graphOptions.nodes[nodeId];
    if (!node) return undefined;
    const typeDef = graphOptions.config[node.type];
    return (
      typeDef.ports.in?.find((p: PortDefinition) => p.name === portName) ??
      typeDef.ports.out?.find((p: PortDefinition) => p.name === portName)
    );
  }

  createComputed(
    mapArray(
      () => Object.keys(graphOptions.nodes),
      (id) => {
        createComputed(() => {
          const node = graphOptions.nodes[id];
          const typeDef = graphOptions.config[node.type];

          if (!typeDef?.construct) {
            throw new Error(
              `Expected ${node.type} to be defined in the graph-config. Valid node-kinds: ${Object.keys(graphOptions.config)}`,
            );
          }

          const constructOptions = mergeProps(node, graphOptions, {
            setState(
              callback: (
                state: InferStateFromGraphConfig<TConfig>,
              ) => InferStateFromGraphConfig<TConfig> | void,
            ) {
              return graphOptions.onNodeUpdate?.({
                nodeId: id,
                callback(node) {
                  const state = callback(node.state);
                  if (state) {
                    return {
                      ...node,
                      state,
                    };
                  }
                },
              });
            },
            isInputConnected: (portName: string) =>
              Object.values(graphOptions.edges).some(
                (e) => e.input.node === node.id && e.input.port === portName,
              ),
          });

          createComputed(() => {
            const result = typeDef.construct(constructOptions);
            setConstructResults(id, result);
          });
        });
      },
    ),
  );

  // Edge lifecycle: connect/disconnect audio ports when edges change
  createEffect(
    mapArray(
      () => Object.keys(graphOptions.edges),
      (edgeId) => {
        createEffect(() => {
          const edge = graphOptions.edges[edgeId];

          const from = constructResults[edge.output.node];
          const to = constructResults[edge.input.node];

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

  return mergeProps(pickProps(graphOptions, ["config", "nodes", "edges"]), {
    constructResults,
    getPortDef,
    addNode({ type, id = crypto.randomUUID(), x, y }) {
      const typeDef = graphOptions.config[type];

      graphOptions.onNodeAdd?.({
        nodeId: id,
        node: {
          id,
          type,
          x,
          y,
          ...typeDef.dimensions,
          state: { ...graphOptions.config[type]?.state },
        },
      });

      return id;
    },
    deleteNode(nodeId) {
      batch(() => {
        for (const [edgeId, { input, output }] of Object.entries(
          graphOptions.edges,
        )) {
          if (input.node === nodeId || output.node === nodeId) {
            graphOptions.onEdgeDelete?.({ edgeId });
          }
        }
        graphOptions.onNodeDelete?.({ nodeId });
      });
    },
    updateNode(nodeId, callback) {
      graphOptions.onNodeUpdate?.({ nodeId: nodeId, callback });
    },
    deleteEdge(edgeId) {
      graphOptions.onEdgeDelete?.({ edgeId });
    },
    addEdge({ id = crypto.randomUUID(), output, input }) {
      const exists = Object.values(graphOptions.edges).find(
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

      graphOptions.onEdgeAdd?.({ edgeId: id, edge: { output, input } });

      return id;
    },
    spliceNodeIntoEdge(edgeId, nodeId) {
      const node = assertedNotNullish(
        graphOptions.nodes[nodeId],
        `Could not find node ${nodeId}.`,
      );

      const nodeDefinition = assertedNotNullish(
        graphOptions.config[node.type],
        "Could not find node definition in config.",
      );

      const firstInPort = nodeDefinition.ports.in?.[0];
      const firstOutPort = nodeDefinition.ports.out?.[0];

      if (!firstInPort || !firstOutPort) return;

      const edgeId1 = crypto.randomUUID();
      const edgeId2 = crypto.randomUUID();
      const edge = graphOptions.edges[edgeId];

      batch(() => {
        graphOptions.onEdgeDelete?.({ edgeId });

        graphOptions.onEdgeAdd?.({
          edgeId: edgeId1,
          edge: {
            output: edge.output,
            input: { node: nodeId, port: firstInPort.name },
          },
        });

        graphOptions.onEdgeAdd?.({
          edgeId: edgeId2,
          edge: {
            output: { node: nodeId, port: firstOutPort.name },
            input: edge.input,
          },
        });
      });

      return [edgeId1, edgeId2] as const;
    },
  } satisfies Partial<GraphAPI<TConfig>>);
}
