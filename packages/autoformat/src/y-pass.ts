import {
  IntervalStructure,
  type AnalysisResult,
  type AutoformatOptions,
  type IslandLayout,
} from "./types";

/**
 * Assign y-positions using the pre-computed DFS row order.
 *
 * Each row's y = max_bottom_y across its x-span (via IntervalStructure) + gap.
 * The interval structure is seeded so row 0 lands at primaryRoot.initialY.
 */
export function yPass(
  ctx: AnalysisResult,
  xFinal: Map<string, number>,
  options: AutoformatOptions,
): Map<string, number> {
  const { infos, rowOf, rowOrder, primaryRoot } = ctx;
  const yOut = new Map<string, number>();

  // Build row → nodes mapping
  const rowNodes = new Map<number, string[]>();

  for (const [id, row] of rowOf) {
    if (!rowNodes.has(row)) {
      rowNodes.set(row, []);
    }

    rowNodes.get(row)!.push(id);
  }

  // Seed baseBottomY so that row 0 lands at primaryRoot.initialY
  const intervals = new IntervalStructure(
    primaryRoot.initialY - options.gap,
  );

  for (const row of rowOrder) {
    const nodeIds = rowNodes.get(row) ?? [];

    if (nodeIds.length === 0) {
      continue;
    }

    let xMin = Infinity;
    let xMax = -Infinity;
    let rowHeight = 0;

    for (const id of nodeIds) {
      const nodeX = xFinal.get(id)!;
      const info = infos.get(id)!;
      xMin = Math.min(xMin, nodeX);
      xMax = Math.max(xMax, nodeX + info.width);
      rowHeight = Math.max(rowHeight, info.height);
    }

    const y = intervals.queryMaxBottomY(xMin, xMax) + options.gap;

    for (const id of nodeIds) {
      yOut.set(id, y);
    }

    // Insert per-node intervals using each node's own height.
    // This lets nodes in adjacent columns (non-overlapping x-ranges) avoid
    // being blocked by the tallest node in the row.
    for (const id of nodeIds) {
      const nodeX = xFinal.get(id)!;
      const info = infos.get(id)!;
      intervals.insert(nodeX, nodeX + info.width, y + info.height);
    }
  }

  return yOut;
}

/**
 * Island Collision Resolution
 *
 * Sort islands by their primary root y (ascending). For each island, query a
 * shared sorted interval structure (built from all already-placed islands' nodes)
 * to find the precise max bottom-Y across each node's x-range. The uniform shift
 * for the island = max(interval_query(node) + gap - node.y) across all nodes.
 * Apply that shift, then insert this island's nodes into the shared structure.
 *
 * This is more precise than bbox-vs-bbox: two islands whose bounding boxes
 * overlap but whose actual node footprints don't will not be shifted.
 */
export function resolveIslandCollisions(
  islands: IslandLayout[],
  options: AutoformatOptions,
): void {
  islands.sort((a, b) => a.primaryRootY - b.primaryRootY);

  const intervals = new IntervalStructure();

  for (const island of islands) {
    // Compute the uniform downward shift needed across all nodes in this island.
    let maxShift = 0;

    for (const id of island.nodeIds) {
      const nx = island.xFinal.get(id)!;
      const ny = island.yFinal.get(id)!;
      const info = island.infos.get(id)!;
      const maxBottom = intervals.queryMaxBottomY(nx, nx + info.width);

      if (maxBottom === -Infinity) {
        continue;
      }

      const needed = maxBottom + options.gap - ny;

      if (needed > maxShift) {
        maxShift = needed;
      }
    }

    if (maxShift > 0) {
      for (const id of island.nodeIds) {
        island.yFinal.set(id, island.yFinal.get(id)! + maxShift);
      }
    }

    // Insert this island's nodes into the shared interval structure.
    for (const id of island.nodeIds) {
      const nx = island.xFinal.get(id)!;
      const ny = island.yFinal.get(id)!;
      const info = island.infos.get(id)!;
      intervals.insert(nx, nx + info.width, ny + info.height);
    }
  }
}
