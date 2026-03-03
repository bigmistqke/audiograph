import {
  isBoundary,
  isMergeLike,
  type AnalysisResult,
  type Graph,
  type NodeInfo,
} from "./types";

/**
 * Island Detection
 *
 * Find connected components (islands) via BFS over undirected adjacency.
 * Each island is an independent subgraph with no edges to any other.
 */
export function findIslands(infos: Map<string, NodeInfo>): string[][] {
  const visited = new Set<string>();
  const islands: string[][] = [];

  for (const id of infos.keys()) {
    if (visited.has(id)) {
      continue;
    }

    const component: string[] = [];
    const queue = [id];
    while (queue.length > 0) {
      const curr = queue.shift()!;

      if (visited.has(curr)) {
        continue;
      }

      visited.add(curr);
      component.push(curr);
      const info = infos.get(curr)!;

      for (const pid of info.parents) {
        if (!visited.has(pid)) {
          queue.push(pid);
        }
      }

      for (const cid of info.children) {
        if (!visited.has(cid)) {
          queue.push(cid);
        }
      }
    }
    islands.push(component);
  }

  return islands;
}

/**
 * Topology Analysis
 */
export function buildTopology(graph: Graph): Map<string, NodeInfo> {
  const infos = new Map<string, NodeInfo>();

  for (const [id, node] of Object.entries(graph.nodes)) {
    infos.set(id, {
      id,
      role: "simple",
      parents: [],
      children: [],
      initialX: node.x,
      initialY: node.y,
      width: node.width,
      height: node.height,
    });
  }

  // Build adjacency — deduplicate multi-port connections between the same node pair
  const parentSets = new Map<string, Set<string>>();
  const childSets = new Map<string, Set<string>>();

  for (const edge of Object.values(graph.edges)) {
    const outId = edge.output.node;
    const inId = edge.input.node;

    if (!childSets.has(outId)) {
      childSets.set(outId, new Set());
    }

    childSets.get(outId)!.add(inId);

    if (!parentSets.has(inId)) {
      parentSets.set(inId, new Set());
    }

    parentSets.get(inId)!.add(outId);
  }

  for (const info of infos.values()) {
    info.parents = [...(parentSets.get(info.id) ?? [])];
    info.children = [...(childSets.get(info.id) ?? [])];

    const nIn = info.parents.length;
    const nOut = info.children.length;

    if (nIn === 0) {
      info.role = "root";
      continue;
    }
    if (nIn > 1 && nOut > 1) {
      info.role = "merge-split";
      continue;
    }
    if (nIn > 1) {
      info.role = "merge";
      continue;
    }
    if (nOut > 1) {
      info.role = "split";
      continue;
    }
    if (nOut === 0) {
      info.role = "leaf";
      continue;
    }
    {
      info.role = "simple";
      continue;
    }
  }

  return infos;
}

/**
 * Trace a chain from a boundary node through one of its output children.
 */
function traceChain(
  startId: string,
  firstChildId: string,
  infos: Map<string, NodeInfo>,
): string[] {
  const chain = [startId];
  let currentId = firstChildId;

  while (true) {
    chain.push(currentId);
    const current = infos.get(currentId)!;

    if (isBoundary(current.role)) {
      break;
    }
    if (current.children.length === 0) {
      break; // safety guard
    }

    currentId = current.children[0];
  }

  return chain;
}

/**
 * Chain Precomputation
 *
 * Trace all chains once after topology analysis. Stores chains as:
 *   chainMap: startBoundaryId → (firstChildId → chain[])
 *
 * All later passes use chainMap.get(startId)!.get(firstChildId)! instead of
 * calling traceChain() on every traversal.
 */
export function buildChainMap(
  infos: Map<string, NodeInfo>,
): Map<string, Map<string, string[]>> {
  const chainMap = new Map<string, Map<string, string[]>>();

  for (const info of infos.values()) {
    if (!isBoundary(info.role)) {
      continue;
    }

    const byFirstChild = new Map<string, string[]>();

    for (const firstChildId of info.children) {
      byFirstChild.set(firstChildId, traceChain(info.id, firstChildId, infos));
    }

    chainMap.set(info.id, byFirstChild);
  }
  return chainMap;
}

/**
 * Topological sort (Kahn's)
 */
export function topologicalSort(infos: Map<string, NodeInfo>): string[] {
  const inDegree = new Map<string, number>();

  for (const info of infos.values()) {
    inDegree.set(info.id, info.parents.length);
  }

  const queue = [...infos.values()]
    .filter((n) => n.parents.length === 0)
    .sort((a, b) => a.initialY - b.initialY || a.initialX - b.initialX)
    .map((n) => n.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);

    for (const childId of infos.get(id)!.children) {
      const deg = inDegree.get(childId)! - 1;
      inDegree.set(childId, deg);

      if (deg === 0) {
        queue.push(childId);
      }
    }
  }

  return order;
}

/**
 * Ancestor Sets
 *
 * Precompute the full ancestor set for every node in one O(n) pass (topological
 * order guarantees all parents are processed before their children).
 * Replaces the recursive isDescendantOf + descCache pattern.
 */
export function buildAncestorSets(
  infos: Map<string, NodeInfo>,
  order: string[],
): Map<string, Set<string>> {
  const ancestors = new Map<string, Set<string>>();

  for (const id of order) {
    const anc = new Set<string>();

    for (const pid of infos.get(id)!.parents) {
      anc.add(pid);

      for (const a of ancestors.get(pid)!) {
        anc.add(a);
      }
    }

    ancestors.set(id, anc);
  }
  return ancestors;
}

/**
 * Row Assignment
 *
 * Process boundary nodes in topological order. At each node, sort output chains
 * by the initial y of their first child (ascending). The first unclaimed chain
 * continues in the current row (spine); subsequent unclaimed chains open new rows.
 * Already-claimed chain ends represent cross-row edges — no new row is opened.
 * Row claiming is first-come-first-served in y-order across the whole traversal.
 */
export function assignRows(
  infos: Map<string, NodeInfo>,
  order: string[],
  chainMap: Map<string, Map<string, string[]>>,
): Map<string, number> {
  const rowOf = new Map<string, number>();
  const spineMerges = new Set<string>();
  let nextRow = 0;

  for (const id of order) {
    const info = infos.get(id)!;

    if (info.role === "simple" || info.role === "leaf") {
      continue;
    }

    if (!rowOf.has(id)) {
      rowOf.set(id, nextRow++);
    }

    const currentRow = rowOf.get(id)!;

    const sortedChildren = [...info.children].sort(
      (a, b) => infos.get(a)!.initialY - infos.get(b)!.initialY,
    );

    let spineAssigned = false;

    for (const firstChildId of sortedChildren) {
      const chain = chainMap.get(id)!.get(firstChildId)!;
      const endId = chain[chain.length - 1];

      if (rowOf.has(endId)) {
        // End boundary already claimed → cross-row edge.
        // Interior nodes still open their own row.
        // If this chain's row is higher priority (lower index) than the end
        // boundary's current row, prefer it — the higher-priority row wins.
        const isFirstChain = !spineAssigned;
        const chainRow = isFirstChain ? currentRow : nextRow++;

        let usedCurrentRow = false;

        if (
          isMergeLike(infos.get(endId)!.role) &&
          chainRow < rowOf.get(endId)!
        ) {
          rowOf.set(endId, chainRow);
          spineMerges.add(endId);
          usedCurrentRow = true;
        }

        for (let i = 1; i < chain.length - 1; i++) {
          if (!rowOf.has(chain[i])) {
            rowOf.set(chain[i], chainRow);
            usedCurrentRow = true;
          }
        }

        // Only consume the spine if the current row was actually used
        // (by pulling the merge or assigning interior nodes). Otherwise,
        // the current row stays available for the next unclaimed chain.
        if (isFirstChain && usedCurrentRow) {
          spineAssigned = true;
        }

        continue;
      }

      const isSpine = !spineAssigned;
      const chainRow = isSpine ? currentRow : nextRow++;

      if (!spineAssigned) {
        spineAssigned = true;
      }

      for (let i = 1; i < chain.length; i++) {
        if (!rowOf.has(chain[i])) {
          rowOf.set(chain[i], chainRow);
          if (isSpine && isMergeLike(infos.get(chain[i])!.role)) {
            spineMerges.add(chain[i]);
          }
        }
      }
    }
  }

  // Post-process: when a boundary's spine was pulled to a higher-priority row,
  // the boundary is left alone in its row. Move leaf-ending sibling chains
  // into the boundary's row so they share vertical placement.
  for (const [boundaryId, byFirstChild] of chainMap) {
    const boundaryRow = rowOf.get(boundaryId)!;

    // Check if any chain from this boundary still has nodes in its row.
    let hasRowOccupants = false;
    for (const chain of byFirstChild.values()) {
      for (let i = 1; i < chain.length; i++) {
        if (rowOf.get(chain[i]) === boundaryRow) {
          hasRowOccupants = true;
          break;
        }
      }
      if (hasRowOccupants) break;
    }

    if (hasRowOccupants) continue;

    // Boundary is orphaned — move leaf-ending chains to its row.
    for (const chain of byFirstChild.values()) {
      const endId = chain[chain.length - 1];
      if (infos.get(endId)!.role !== "leaf") continue;
      for (let i = 1; i < chain.length; i++) {
        rowOf.set(chain[i], boundaryRow);
      }
    }
  }

  // Post-process: push non-spine merges down to max(parent rows).
  // Spine merges are anchored to their spine parent's row and must not move.
  for (const id of order) {
    const info = infos.get(id)!;
    if (!isMergeLike(info.role) || spineMerges.has(id)) {
      continue;
    }

    let maxParentRow = 0;
    for (const pid of info.parents) {
      const pRow = rowOf.get(pid);
      if (pRow !== undefined && pRow > maxParentRow) {
        maxParentRow = pRow;
      }
    }

    if (rowOf.get(id)! < maxParentRow) {
      rowOf.set(id, maxParentRow);
    }
  }

  return rowOf;
}

/**
 * Build a map of "merge approach" nodes — the last interior node in a chain
 * whose end boundary is a merge in a strictly higher-priority row (Merge Approach rule).
 *
 * These nodes get special positioning: x = max(prev.right + gap, end.x - width - gap),
 * pulling them toward the merge they feed into.
 */
export function buildMergeApproachMap(
  infos: Map<string, NodeInfo>,
  rowOf: Map<string, number>,
  chainMap: Map<string, Map<string, string[]>>,
): Map<string, { endId: string; prevId: string; startId: string }> {
  const mergeApproachMap = new Map<
    string,
    { endId: string; prevId: string; startId: string }
  >();

  for (const info of infos.values()) {
    if (!isBoundary(info.role)) {
      continue;
    }

    const startRow = rowOf.get(info.id) ?? 0;

    for (const firstChildId of info.children) {
      const chain = chainMap.get(info.id)!.get(firstChildId)!;
      if (chain.length < 3) {
        continue; // need at least 1 internal node
      }

      const endId = chain[chain.length - 1];

      if (!isMergeLike(infos.get(endId)!.role)) {
        continue;
      }

      const endRow = rowOf.get(endId) ?? 0;

      if (endRow >= startRow) {
        continue; // end must be strictly higher priority
      }

      const lastInternalId = chain[chain.length - 2];
      if (!mergeApproachMap.has(lastInternalId)) {
        // prev = node just before lastInternal in the chain
        const prevId = chain.length >= 4 ? chain[chain.length - 3] : info.id;
        mergeApproachMap.set(lastInternalId, {
          endId,
          prevId,
          startId: info.id,
        });
      }
    }
  }

  return mergeApproachMap;
}

/**
 * Row Order
 *
 * Sort rows by the initialY of the first node assigned to each row
 * (in topological order). This ensures the node that *created* the row
 * determines its vertical placement, rather than a downstream merge or
 * simple node that may have a very different initialY.
 */
export function buildRowOrder(
  infos: Map<string, NodeInfo>,
  rowOf: Map<string, number>,
  order: string[],
  primaryRootRow: number,
): number[] {
  // The first node in topological order for each row is the node that
  // created/defined it. Use its initialY for ordering.
  const rowStarterY = new Map<number, number>();

  for (const id of order) {
    const row = rowOf.get(id);

    if (row !== undefined && !rowStarterY.has(row)) {
      rowStarterY.set(row, infos.get(id)!.initialY);
    }
  }

  // The primary root's row must always come first: the y-pass seeds
  // its interval structure at primaryRoot.initialY - gap, so the first
  // row processed lands at primaryRoot.initialY. If a branch child has
  // a lower initialY, its row would otherwise sort first and push the
  // spine down.
  return [...rowStarterY.keys()].sort((a, b) => {
    if (a === primaryRootRow) return -1;
    if (b === primaryRootRow) return 1;
    return rowStarterY.get(a)! - rowStarterY.get(b)!;
  });
}

/**
 * Run the full analysis pipeline for an island.
 */
export function analysis(infos: Map<string, NodeInfo>): AnalysisResult {
  const order = topologicalSort(infos);
  const chainMap = buildChainMap(infos);
  const ancestorSets = buildAncestorSets(infos, order);

  const primaryRoot = [...infos.values()]
    .filter((n) => n.role === "root")
    .sort((a, b) => a.initialY - b.initialY || a.initialX - b.initialX)[0];

  const rowOf = assignRows(infos, order, chainMap);
  const mergeApproachMap = buildMergeApproachMap(infos, rowOf, chainMap);
  const rowOrder = buildRowOrder(infos, rowOf, order, rowOf.get(primaryRoot.id)!);

  return {
    infos,
    order,
    chainMap,
    ancestorSets,
    primaryRoot,
    rowOf,
    mergeApproachMap,
    rowOrder,
  };
}
