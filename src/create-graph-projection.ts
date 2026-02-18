import { ReactiveMap } from "@solid-primitives/map";
import { createEffect, mapArray, onCleanup } from "solid-js";
import type { createGraph, GraphConfig } from "./create-graph";

interface Connectable {
  connect(target: any): any;
  disconnect(target?: any): void;
}

export type ProjectionResult = {
  in: Record<string, any>;
  out: Record<string, Connectable>;
};

export function createGraphProjection<T extends GraphConfig, C>(
  graphAPI: ReturnType<typeof createGraph<T>>,
  ctx: C,
  factories: {
    [K in keyof T]?: (ctx: C, state: any) => ProjectionResult;
  },
) {
  const projectedNodes = new ReactiveMap<string, ProjectionResult>();

  const mappedNodes = mapArray(
    () => graphAPI.graph.nodes,
    (node) => {
      const factory = factories[node.type];
      if (!factory) return;

      const stateEntry = graphAPI.nodeStates.get(node.id);
      const state = stateEntry?.state ?? {};
      const result = factory(ctx, state);
      projectedNodes.set(node.id, result);

      onCleanup(() => {
        for (const port of Object.values(result.out)) {
          port.disconnect();
        }
        projectedNodes.delete(node.id);
      });

      return result;
    },
  );

  createEffect(() => mappedNodes());

  const mappedEdges = mapArray(
    () => graphAPI.graph.edges,
    (edge) => {
      createEffect(() => {
        const from = projectedNodes.get(edge.from.node);
        const to = projectedNodes.get(edge.to.node);

        if (!from || !to) return;

        const outPort = from.out[edge.from.port];
        const inPort = to.in[edge.to.port];

        if (!outPort || !inPort) return;

        outPort.connect(inPort);
        onCleanup(() => outPort.disconnect(inPort));
      });
    },
  );

  createEffect(() => mappedEdges());

  return projectedNodes;
}
