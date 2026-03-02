import { analysis, buildTopology, findIslands } from "./analysis";
import type { AutoformatOptions, Graph, IslandLayout, LayoutNode, NodeInfo } from "./types";
import { xPass } from "./x-pass";
import { resolveIslandCollisions, yPass } from "./y-pass";

export type { AutoformatOptions, LayoutNode } from "./types";

const DEFAULT_GAP = 30;

/**
 * Per Island Layout
 */
function layoutIsland(
  islandInfos: Map<string, NodeInfo>,
  options: AutoformatOptions,
) {
  const ctx = analysis(islandInfos);
  const xFinal = xPass(ctx, options);
  const yFinal = yPass(ctx, xFinal, options);
  return { xFinal, yFinal, primaryRoot: ctx.primaryRoot };
}

export function computeLayoutMap(
  graph: Graph,
  { gap = DEFAULT_GAP }: Partial<AutoformatOptions> = { gap: DEFAULT_GAP },
): Map<string, LayoutNode> {
  if (Object.keys(graph.nodes).length === 0) {
    return new Map();
  }

  const infos = buildTopology(graph);
  const islandGroups = findIslands(infos);

  const islandLayouts: IslandLayout[] = islandGroups.map((nodeIds) => {
    const islandInfos = new Map(nodeIds.map((id) => [id, infos.get(id)!]));
    const { xFinal, yFinal, primaryRoot } = layoutIsland(islandInfos, { gap });

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
