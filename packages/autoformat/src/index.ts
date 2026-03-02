import {
  assignRows,
  buildAncestorSets,
  buildChainMap,
  buildDFSRowOrder,
  buildMergeApproachMap,
  buildTopology,
  findIslands,
  topologicalSort,
} from "./analysis";
import type {
  AutoformatOptions,
  Graph,
  IslandLayout,
  LayoutNode,
  NodeInfo,
} from "./types";
import {
  computeInitialXPositions,
  pullSplitsTowardMerges,
  reconcileXPositions,
} from "./x-pass";
import { resolveIslandCollisions, yPass } from "./y-pass";

export type { AutoformatOptions, LayoutNode } from "./types";

const GAP = 30;

/**
 * Per Island Layout
 */
function layoutIsland(
  islandInfos: Map<string, NodeInfo>,
  options: AutoformatOptions,
): {
  xFinal: Map<string, number>;
  yFinal: Map<string, number>;
  rowOf: Map<string, number>;
} {
  // ── Analysis ──────────────────────────────────────────────────────────────
  const order = topologicalSort(islandInfos);
  const chainMap = buildChainMap(islandInfos);
  const ancestorSets = buildAncestorSets(islandInfos, order);

  const primaryRoot = [...islandInfos.values()]
    .filter((n) => n.role === "root")
    .sort((a, b) => a.initialY - b.initialY || a.initialX - b.initialX)[0];

  const rowOf = assignRows(islandInfos, order, chainMap);
  const mergeApproachMap = buildMergeApproachMap(islandInfos, rowOf, chainMap);
  const rowOrder = buildDFSRowOrder(islandInfos, rowOf, primaryRoot.id);

  // ── X-Pass ────────────────────────────────────────────────────────────────
  const initialXPositions = computeInitialXPositions(
    islandInfos,
    primaryRoot.id,
    order,
    options,
  );
  const xAfterSplitPull = pullSplitsTowardMerges(
    islandInfos,
    primaryRoot.id,
    order,
    rowOf,
    initialXPositions,
    chainMap,
    ancestorSets,
    options,
  );
  const xFinal = reconcileXPositions(
    islandInfos,
    order,
    primaryRoot.id,
    xAfterSplitPull,
    mergeApproachMap,
    ancestorSets,
    options,
  );

  // ── Y-Pass ────────────────────────────────────────────────────────────────
  const yFinal = yPass(
    islandInfos,
    xFinal,
    rowOf,
    rowOrder,
    primaryRoot.id,
    options,
  );

  return { xFinal, yFinal, rowOf };
}

export function computeLayoutMap(
  graph: Graph,
  { gap = GAP }: Partial<AutoformatOptions> = { gap: GAP },
): Map<string, LayoutNode> {
  if (Object.keys(graph.nodes).length === 0) {
    return new Map();
  }

  const infos = buildTopology(graph);
  const islandGroups = findIslands(infos);

  const islandLayouts: IslandLayout[] = islandGroups.map((nodeIds) => {
    const islandInfos = new Map(nodeIds.map((id) => [id, infos.get(id)!]));
    const { xFinal, yFinal } = layoutIsland(islandInfos, { gap });

    const primaryRoot = [...islandInfos.values()]
      .filter((n) => n.role === "root")
      .sort((a, b) => a.initialY - b.initialY || a.initialX - b.initialX)[0];

    return {
      nodeIds,
      infos: islandInfos,
      xFinal,
      yFinal,
      primaryRootY: primaryRoot.initialY,
    };
  });

  resolveIslandCollisions(islandLayouts, { gap });

  const result = new Map<string, LayoutNode>();

  for (const { nodeIds, infos: islandInfos, xFinal, yFinal } of islandLayouts) {
    for (const id of nodeIds) {
      const info = islandInfos.get(id)!;
      result.set(id, {
        id,
        x: xFinal.get(id)!,
        y: yFinal.get(id)!,
        row: 0,
        width: info.width,
        height: info.height,
      });
    }
  }

  return result;
}

export function autoformat<T extends Graph>(
  graph: T,
  options?: Partial<AutoformatOptions>,
): T {
  const layout = computeLayoutMap(graph, options);
  const nodes = { ...graph.nodes };

  for (const id of Object.keys(nodes)) {
    const result = layout.get(id);

    if (result) {
      nodes[id] = { ...nodes[id], x: result.x, y: result.y };
    }
  }
  return { ...graph, nodes };
}
