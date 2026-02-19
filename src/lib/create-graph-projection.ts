import { ReactiveMap } from "@solid-primitives/map";
import { createEffect, mapArray, onCleanup } from "solid-js";
import type { createGraph, GraphConfig, NodeTypeDef } from "./create-graph";

interface Connectable {
  connect(target: any): any;
  disconnect(target?: any): void;
}

export type ProjectionResult = {
  in?: Record<string, any>;
  out?: Record<string, Connectable>;
};

/** Extract the state type from a NodeTypeDef, defaulting to empty object */
type StateOf<N> = N extends NodeTypeDef<infer S> ? S : Record<string, never>;

type ProjectionFactories<T extends GraphConfig> = {
  [K in keyof T]?: (state: StateOf<T[K]>, nodeId: string) => ProjectionResult;
};

export function createGraphProjection<T extends GraphConfig>(
  graphAPI: ReturnType<typeof createGraph<T>>,
  factories: ProjectionFactories<T>,
) {
  const projectedNodes = new ReactiveMap<string, ProjectionResult>();

  const mappedNodes = mapArray(
    () => graphAPI.graph.nodes,
    (node) => {
      const factory = factories[node.type];
      if (!factory) return;

      const stateEntry = graphAPI.nodeStates.get(node.id);
      const state = stateEntry?.state ?? {};
      const result = factory(state, node.id);
      projectedNodes.set(node.id, result);

      onCleanup(() => {
        if (result.out) {
          for (const port of Object.values(result.out)) {
            port.disconnect();
          }
          projectedNodes.delete(node.id);
        }
      });

      return result;
    },
  );

  createEffect(() => mappedNodes());

  const mappedEdges = mapArray(
    () => graphAPI.graph.edges,
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

  return projectedNodes;
}
