import type { Edges, Nodes } from "@audiograph/create-graph";

interface Graph {
  nodes: Nodes;
  edges: Edges;
}

const GAP = 30;

/**
 * Sorted interval structure for efficient max-bottom-Y queries over x-ranges.
 * Used by both the y-pass (row placement) and island collision resolution.
 */
class IntervalStructure {
  private intervals: Array<{ xStart: number; xEnd: number; bottomY: number }> =
    [];
  private baseBottomY: number;

  constructor(baseBottomY = -Infinity) {
    this.baseBottomY = baseBottomY;
  }

  insert(xStart: number, xEnd: number, bottomY: number) {
    const iv = { xStart, xEnd, bottomY };
    let i = this.intervals.length;
    while (i > 0 && this.intervals[i - 1].xStart > xStart) i--;
    this.intervals.splice(i, 0, iv);
  }

  queryMaxBottomY(xStart: number, xEnd: number): number {
    let max = this.baseBottomY;
    for (const iv of this.intervals) {
      if (iv.xStart >= xEnd) break;
      if (iv.xEnd > xStart && iv.bottomY > max) max = iv.bottomY;
    }
    return max;
  }
}

/**********************************************************************************/
/*                                                                                */
/*                                      Types                                     */
/*                                                                                */
/**********************************************************************************/

type NodeRole = "root" | "leaf" | "simple" | "split" | "merge" | "merge-split";

interface NodeInfo {
  id: string;
  role: NodeRole;
  parents: string[];
  children: string[];
  initialX: number;
  initialY: number;
  width: number;
  height: number;
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  row: number;
  width: number;
  height: number;
}

function isMergeLike(role: NodeRole): boolean {
  return role === "merge" || role === "merge-split";
}

/**
 * A "boundary" node is any non-simple node (root, leaf, split, merge, merge-split).
 * Chains run between boundary nodes; simple nodes are interior to chains.
 */
function isBoundary(role: NodeRole): boolean {
  return role !== "simple";
}

/**
 * Step 1: Topology Analysis
 */
function buildTopology(graph: Graph): Map<string, NodeInfo> {
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
    if (!childSets.has(outId)) childSets.set(outId, new Set());
    childSets.get(outId)!.add(inId);
    if (!parentSets.has(inId)) parentSets.set(inId, new Set());
    parentSets.get(inId)!.add(outId);
  }

  for (const info of infos.values()) {
    info.parents = [...(parentSets.get(info.id) ?? [])];
    info.children = [...(childSets.get(info.id) ?? [])];

    const nIn = info.parents.length;
    const nOut = info.children.length;

    if (nIn === 0) info.role = "root";
    else if (nIn > 1 && nOut > 1) info.role = "merge-split";
    else if (nIn > 1) info.role = "merge";
    else if (nOut > 1) info.role = "split";
    else if (nOut === 0) info.role = "leaf";
    else info.role = "simple";
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
    if (isBoundary(current.role)) break;
    if (current.children.length === 0) break; // safety guard
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
function buildChainMap(
  infos: Map<string, NodeInfo>,
): Map<string, Map<string, string[]>> {
  const chainMap = new Map<string, Map<string, string[]>>();
  for (const info of infos.values()) {
    if (!isBoundary(info.role)) continue;
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
function topologicalSort(infos: Map<string, NodeInfo>): string[] {
  const inDegree = new Map<string, number>();
  for (const info of infos.values()) inDegree.set(info.id, info.parents.length);

  const queue = [...infos.values()]
    .filter((n) => n.parents.length === 0)
    .map((n) => n.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const childId of infos.get(id)!.children) {
      const deg = inDegree.get(childId)! - 1;
      inDegree.set(childId, deg);
      if (deg === 0) queue.push(childId);
    }
  }

  return order;
}

/**
 * Step 2a: Row Assignment
 *
 * Process boundary nodes in topological order. At each node, sort output chains
 * by the initial y of their first child (ascending). The first unclaimed chain
 * continues in the current row (spine); subsequent unclaimed chains open new rows.
 * Already-claimed chain ends represent cross-row edges — no new row is opened.
 * Row claiming is first-come-first-served in y-order across the whole traversal.
 */
function assignRows(
  infos: Map<string, NodeInfo>,
  order: string[],
  chainMap: Map<string, Map<string, string[]>>,
): Map<string, number> {
  const rowOf = new Map<string, number>();
  let nextRow = 0;

  for (const id of order) {
    const info = infos.get(id)!;
    if (info.role === "simple" || info.role === "leaf") continue;

    if (!rowOf.has(id)) rowOf.set(id, nextRow++);
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
        const chainRow = !spineAssigned ? currentRow : nextRow++;
        if (!spineAssigned) spineAssigned = true;
        if (
          isMergeLike(infos.get(endId)!.role) &&
          chainRow < rowOf.get(endId)!
        ) {
          rowOf.set(endId, chainRow);
        }
        for (let i = 1; i < chain.length - 1; i++) {
          if (!rowOf.has(chain[i])) rowOf.set(chain[i], chainRow);
        }
        continue;
      }

      const chainRow = !spineAssigned ? currentRow : nextRow++;
      if (!spineAssigned) spineAssigned = true;

      for (let i = 1; i < chain.length; i++) {
        if (!rowOf.has(chain[i])) rowOf.set(chain[i], chainRow);
      }
    }
  }

  return rowOf;
}

/**
 * Compute provisional x-positions for all nodes in topological order.
 *
 * Placement rules:
 *   - Primary root: anchored to current user position (Anchor rule).
 *   - Merge/merge-split: max(parent.right for ALL parents) + gap (Merge Alignment rule).
 *   - All others: prev.right + gap; secondary roots start at 0 (Sequential rule).
 */
function computeInitialXPositions(
  infos: Map<string, NodeInfo>,
  primaryRootId: string,
  order: string[],
): Map<string, number> {
  const x = new Map<string, number>();

  for (const id of order) {
    const info = infos.get(id)!;

    if (id === primaryRootId) {
      x.set(id, info.initialX); // Anchor rule
    } else if (isMergeLike(info.role)) {
      // Merge Alignment: max of all parents' right edges + gap
      let maxRight = -Infinity;
      for (const pid of info.parents) {
        const right = x.get(pid)! + infos.get(pid)!.width;
        if (right > maxRight) maxRight = right;
      }
      x.set(id, maxRight + GAP);
    } else if (info.parents.length === 0) {
      // secondary root: provisional, adjusted by Split Pull
      x.set(id, 0);
    } else {
      // Sequential: from single parent
      const prevId = info.parents[0];
      const prevInfo = infos.get(prevId)!;
      x.set(id, x.get(prevId)! + prevInfo.width + GAP);
    }
  }

  return x;
}

/**
 * Ancestor Sets
 *
 * Precompute the full ancestor set for every node in one O(n) pass (topological
 * order guarantees all parents are processed before their children).
 * Replaces the recursive isDescendantOf + descCache pattern.
 */
function buildAncestorSets(
  infos: Map<string, NodeInfo>,
  order: string[],
): Map<string, Set<string>> {
  const ancestors = new Map<string, Set<string>>();
  for (const id of order) {
    const anc = new Set<string>();
    for (const pid of infos.get(id)!.parents) {
      anc.add(pid);
      for (const a of ancestors.get(pid)!) anc.add(a);
    }
    ancestors.set(id, anc);
  }
  return ancestors;
}

/**
 * Compute a merge's x-position considering only parents outside a split's subtree.
 *
 * For merge M and split S: max(right-edges of M's parents NOT downstream of S) + GAP.
 * Returns -Infinity if M has no external parents (i.e. M is not independent of S).
 */
function computeMergeXExcludingSubtree(
  mergeId: string,
  splitId: string,
  infos: Map<string, NodeInfo>,
  x: Map<string, number>,
  ancestorSets: Map<string, Set<string>>,
): number {
  let maxExternal = -Infinity;
  for (const pid of infos.get(mergeId)!.parents) {
    if (pid === splitId || ancestorSets.get(pid)!.has(splitId)) continue;
    const right = x.get(pid)! + infos.get(pid)!.width;
    if (right > maxExternal) maxExternal = right;
  }
  if (maxExternal === -Infinity) return -Infinity; // not independent
  return maxExternal + GAP;
}

/**
 * Propagate Sequential
 *
 * After a split is pulled, propagate the new x through simple and leaf nodes
 * downstream. Stop at merge/split/merge-split boundaries (they have their own
 * placement rules). Leaves ARE updated (Sequential rule, like simple nodes).
 */
function propagateSequential(
  id: string,
  prevRight: number,
  x: Map<string, number>,
  infos: Map<string, NodeInfo>,
) {
  const info = infos.get(id)!;
  // Stop at true boundary types that have their own rules
  if (isMergeLike(info.role) || info.role === "split" || info.role === "root")
    return;

  x.set(id, prevRight + GAP);
  for (const childId of info.children) {
    propagateSequential(childId, prevRight + GAP + info.width, x, infos);
  }
}

/**
 * Traverse paths from a split to find the most constraining independent merge
 * target, and return the x-position the split should be pulled to (Split Pull rule).
 *
 * Priority:
 *   - PRIMARY: first merge with strictly smaller row index (higher priority)
 *     encountered along each path. Stop traversal at primary targets.
 *   - FALLBACK: merges in same or lower-priority rows. Continue traversal
 *     through them to look for deeper primary targets.
 *   - Same-priority merges: skip as target, continue traversal through them.
 *
 * pathWidthSoFar tracks: sum(widths of [splitId..currentBoundary]) + count*GAP.
 * This equals the minimum horizontal span from S's left edge to place the next
 * node right after currentBoundary.
 */
function findMergePullTarget(
  splitId: string,
  infos: Map<string, NodeInfo>,
  rowOf: Map<string, number>,
  x: Map<string, number>,
  ancestorSets: Map<string, Set<string>>,
  chainMap: Map<string, Map<string, string[]>>,
): number {
  const splitRow = rowOf.get(splitId) ?? 0;
  const splitWidth = infos.get(splitId)!.width;

  let bestPrimaryPull = -Infinity;
  let bestFallbackPull = -Infinity;

  // Prevent revisiting boundaries (handles DAG diamonds and same-priority
  // merges that we pass through).
  const visitedBoundaries = new Set<string>();
  visitedBoundaries.add(splitId);

  function traverse(currentBoundaryId: string, pathWidthSoFar: number) {
    for (const firstChildId of infos.get(currentBoundaryId)!.children) {
      const chain = chainMap.get(currentBoundaryId)!.get(firstChildId)!;
      const endId = chain[chain.length - 1];

      if (visitedBoundaries.has(endId)) continue;

      // Accumulate path width: internals contribute width + gap each.
      // pathWidthSoFar already includes currentBoundary width + 1 gap.
      let internalsWidth = 0;
      for (let i = 1; i < chain.length - 1; i++) {
        internalsWidth += infos.get(chain[i])!.width;
      }
      const nInternals = chain.length - 2;
      const pathWidthToEnd = pathWidthSoFar + internalsWidth + nInternals * GAP;

      const endInfo = infos.get(endId)!;
      if (!isMergeLike(endInfo.role)) {
        // Split: no pull target here, but continue traversal to find deeper merges.
        if (endInfo.role === "split") {
          visitedBoundaries.add(endId);
          traverse(endId, pathWidthToEnd + endInfo.width + GAP);
        }
        continue;
      }

      const endRow = rowOf.get(endId) ?? 0;
      const xWithoutSubtree = computeMergeXExcludingSubtree(endId, splitId, infos, x, ancestorSets);

      if (endRow < splitRow) {
        // PRIMARY target: strictly higher-priority row.
        if (xWithoutSubtree !== -Infinity) {
          const pull = xWithoutSubtree - pathWidthToEnd;
          if (pull > bestPrimaryPull) bestPrimaryPull = pull;
        }
        // Stop this path here (don't traverse past a primary target).
      } else if (endRow === splitRow) {
        // Same priority: valid fallback target if no primary is found; also continue traversal.
        if (xWithoutSubtree !== -Infinity) {
          const pull = xWithoutSubtree - pathWidthToEnd;
          if (pull > bestFallbackPull) bestFallbackPull = pull;
        }
        visitedBoundaries.add(endId);
        traverse(endId, pathWidthToEnd + endInfo.width + GAP);
      } else {
        // FALLBACK target: lower-priority row.
        if (xWithoutSubtree !== -Infinity) {
          const pull = xWithoutSubtree - pathWidthToEnd;
          if (pull > bestFallbackPull) bestFallbackPull = pull;
        }
        // Continue through fallback to look for primary targets deeper.
        visitedBoundaries.add(endId);
        traverse(endId, pathWidthToEnd + endInfo.width + GAP);
      }
    }
  }

  // Initial path width: splitId's width + 1 gap (ready for the next node).
  traverse(splitId, splitWidth + GAP);

  // Primary targets take precedence over fallback targets.
  if (bestPrimaryPull !== -Infinity) return bestPrimaryPull;
  if (bestFallbackPull !== -Infinity) return bestFallbackPull;
  return -Infinity;
}

/**
 * Pull splits and secondary roots leftward toward their downstream merge
 * targets (Split Pull rule).
 *
 * 1. Process secondary roots in y-order (smallest y first), using current
 *    positions — this ensures later secondary roots see updated positions
 *    from already-placed earlier ones.
 * 2. Process splits in reverse topological order (post-order approximation).
 */
function pullSplitsTowardMerges(
  infos: Map<string, NodeInfo>,
  primaryRootId: string,
  order: string[],
  rowOf: Map<string, number>,
  initialXPositions: Map<string, number>,
  chainMap: Map<string, Map<string, string[]>>,
  ancestorSets: Map<string, Set<string>>,
): Map<string, number> {
  const x = new Map(initialXPositions);

  // Secondary roots: process first (y-order) so their splits see the updated x
  // when processed below. Each uses the current x map so it sees positions set
  // by earlier secondary roots.
  const secondaryRoots = [...infos.values()]
    .filter((info) => info.role === "root" && info.id !== primaryRootId)
    .sort((a, b) => a.initialY - b.initialY || a.initialX - b.initialX);

  for (const rootInfo of secondaryRoots) {
    const id = rootInfo.id;

    const pull = findMergePullTarget(id, infos, rowOf, x, ancestorSets, chainMap);
    if (pull === -Infinity) continue;

    // Secondary roots have no prev — pull alone determines x (can be negative).
    const finalX = pull;
    if (finalX === x.get(id)) continue;
    x.set(id, finalX);

    const rootRight = finalX + rootInfo.width;
    for (const childId of rootInfo.children) {
      propagateSequential(childId, rootRight, x, infos);
    }
  }

  // Splits: reverse topological order ≈ post-order DFS.
  // Processed after secondary roots so single-parent splits use their parent's
  // updated x (set above) as the lower bound.
  for (const id of [...order].reverse()) {
    const info = infos.get(id)!;
    if (info.role !== "split") continue;

    const pull = findMergePullTarget(id, infos, rowOf, x, ancestorSets, chainMap);
    if (pull === -Infinity) continue;

    const prevId = info.parents[0];
    const finalX = prevId
      ? Math.max(x.get(prevId)! + infos.get(prevId)!.width + GAP, pull)
      : pull;

    if (finalX === x.get(id)) continue;
    x.set(id, finalX);

    // Propagate updated x through sequential nodes in this split's chains.
    const splitRight = finalX + info.width;
    for (const childId of info.children) {
      propagateSequential(childId, splitRight, x, infos);
    }
  }

  return x;
}

/**
 * Build a map of "merge approach" nodes — the last interior node in a chain
 * whose end boundary is a merge in a strictly higher-priority row (Merge Approach rule).
 *
 * These nodes get special positioning: x = max(prev.right + gap, end.x - width - gap),
 * pulling them toward the merge they feed into.
 */
function buildMergeApproachMap(
  infos: Map<string, NodeInfo>,
  rowOf: Map<string, number>,
  chainMap: Map<string, Map<string, string[]>>,
): Map<string, { endId: string; prevId: string; startId: string }> {
  const mergeApproachMap = new Map<
    string,
    { endId: string; prevId: string; startId: string }
  >();

  for (const info of infos.values()) {
    if (!isBoundary(info.role)) continue;
    const startRow = rowOf.get(info.id) ?? 0;

    for (const firstChildId of info.children) {
      const chain = chainMap.get(info.id)!.get(firstChildId)!;
      if (chain.length < 3) continue; // need at least 1 internal node

      const endId = chain[chain.length - 1];
      if (!isMergeLike(infos.get(endId)!.role)) continue;

      const endRow = rowOf.get(endId) ?? 0;
      if (endRow >= startRow) continue; // end must be strictly higher priority

      const lastInternalId = chain[chain.length - 2];
      if (!mergeApproachMap.has(lastInternalId)) {
        // prev = node just before lastInternal in the chain
        const prevId = chain.length >= 4 ? chain[chain.length - 3] : info.id;
        mergeApproachMap.set(lastInternalId, { endId, prevId, startId: info.id });
      }
    }
  }

  return mergeApproachMap;
}

/**
 * Reconcile x-positions after split pulls.
 *
 * Recomputes all non-fixed nodes in topological order:
 *   - Merge Approach nodes: pull toward their downstream merge.
 *   - Merge/merge-split: max of all parents' right edges + gap (Merge Alignment).
 *   - Simple and leaf: sequential from single parent (Sequential).
 *
 * Fixed nodes (kept as-is): primary root, splits, secondary roots.
 */
function reconcileXPositions(
  infos: Map<string, NodeInfo>,
  order: string[],
  primaryRootId: string,
  x: Map<string, number>,
  mergeApproachMap: Map<string, { endId: string; prevId: string; startId: string }>,
  ancestorSets: Map<string, Set<string>>,
): Map<string, number> {
  const result = new Map(x);

  for (const id of order) {
    const info = infos.get(id)!;

    // Fixed: primary root, splits, and secondary roots (placed by Anchor/Split Pull)
    if (id === primaryRootId) continue;
    if (info.role === "root") continue; // secondary roots
    if (info.role === "split") continue;

    // Merge Approach: last internal before a higher-priority merge.
    // Use xWithoutSubtree to avoid circular dependency: endId's Merge Alignment position may
    // include this node as a parent, so we exclude the chain's startId subtree.
    if (mergeApproachMap.has(id)) {
      const { endId, prevId, startId } = mergeApproachMap.get(id)!;
      const prevInfo = infos.get(prevId)!;
      const prevRight = result.get(prevId)! + prevInfo.width;
      const xWithoutSubtree = computeMergeXExcludingSubtree(endId, startId, infos, result, ancestorSets);
      const pullTarget =
        xWithoutSubtree !== -Infinity ? xWithoutSubtree - info.width - GAP : -Infinity;
      result.set(
        id,
        pullTarget !== -Infinity
          ? Math.max(prevRight + GAP, pullTarget)
          : prevRight + GAP,
      );
      continue;
    }

    // Merge Alignment: max of all parents' right edges + gap
    if (isMergeLike(info.role)) {
      let maxRight = -Infinity;
      for (const pid of info.parents) {
        const right = result.get(pid)! + infos.get(pid)!.width;
        if (right > maxRight) maxRight = right;
      }
      result.set(id, maxRight + GAP);
      continue;
    }

    // Sequential: simple and leaf — from single parent
    if (info.parents.length === 1) {
      const prevId = info.parents[0];
      const prevInfo = infos.get(prevId)!;
      result.set(id, result.get(prevId)! + prevInfo.width + GAP);
    }
  }

  return result;
}

/**
 * Determine DFS row visitation order, then assign y-positions.
 *
 * Rows are visited in DFS order (not row-index order): starting at the primary
 * root, children are sorted by initialY ascending, each subtree fully exhausted
 * before the next sibling. Secondary roots follow in top-left order.
 *
 * Each row's y = max_bottom_y across its x-span (via IntervalStructure) + GAP.
 * The interval structure is seeded so row 0 lands at primaryRoot.initialY.
 */

function buildDFSRowOrder(
  infos: Map<string, NodeInfo>,
  rowOf: Map<string, number>,
  primaryRootId: string,
): number[] {
  const rowsEncountered = new Set<number>();
  const rowOrder: number[] = [];
  const visited = new Set<string>();

  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const row = rowOf.get(nodeId);
    if (row !== undefined && !rowsEncountered.has(row)) {
      rowsEncountered.add(row);
      rowOrder.push(row);
    }

    const info = infos.get(nodeId)!;
    const sortedChildren = [...info.children].sort(
      (a, b) => infos.get(a)!.initialY - infos.get(b)!.initialY,
    );
    for (const childId of sortedChildren) {
      dfs(childId);
    }
  }

  dfs(primaryRootId);

  // Secondary roots in top-left order (smallest y, tie-break smallest x)
  const secondaryRoots = [...infos.values()]
    .filter((n) => n.role === "root" && n.id !== primaryRootId)
    .sort((a, b) => a.initialY - b.initialY || a.initialX - b.initialX);
  for (const root of secondaryRoots) {
    dfs(root.id);
  }

  return rowOrder;
}

function yPass(
  infos: Map<string, NodeInfo>,
  xFinal: Map<string, number>,
  rowOf: Map<string, number>,
  primaryRootId: string,
): Map<string, number> {
  const yOut = new Map<string, number>();

  // Build row → nodes mapping
  const rowNodes = new Map<number, string[]>();
  for (const [id, row] of rowOf) {
    if (!rowNodes.has(row)) rowNodes.set(row, []);
    rowNodes.get(row)!.push(id);
  }

  // Seed baseBottomY so that row 0 lands at primaryRoot.initialY
  const intervals = new IntervalStructure(
    infos.get(primaryRootId)!.initialY - GAP,
  );

  const rowOrder = buildDFSRowOrder(infos, rowOf, primaryRootId);

  for (const row of rowOrder) {
    const nodeIds = rowNodes.get(row) ?? [];
    if (nodeIds.length === 0) continue;

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

    const y = intervals.queryMaxBottomY(xMin, xMax) + GAP;

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
 * Island Detection
 *
 * Find connected components (islands) via BFS over undirected adjacency.
 * Each island is an independent subgraph with no edges to any other.
 */
function findIslands(infos: Map<string, NodeInfo>): string[][] {
  const visited = new Set<string>();
  const islands: string[][] = [];

  for (const id of infos.keys()) {
    if (visited.has(id)) continue;
    const component: string[] = [];
    const queue = [id];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (visited.has(curr)) continue;
      visited.add(curr);
      component.push(curr);
      const info = infos.get(curr)!;
      for (const pid of info.parents) if (!visited.has(pid)) queue.push(pid);
      for (const cid of info.children) if (!visited.has(cid)) queue.push(cid);
    }
    islands.push(component);
  }

  return islands;
}

// ─── Per-Island Layout ────────────────────────────────────────────────────────

function layoutIsland(islandInfos: Map<string, NodeInfo>): {
  xFinal: Map<string, number>;
  yFinal: Map<string, number>;
  rowOf: Map<string, number>;
} {
  const order = topologicalSort(islandInfos);
  const chainMap = buildChainMap(islandInfos);
  const ancestorSets = buildAncestorSets(islandInfos, order);

  const primaryRoot = [...islandInfos.values()]
    .filter((n) => n.role === "root")
    .sort((a, b) => a.initialY - b.initialY || a.initialX - b.initialX)[0];

  const rowOf = assignRows(islandInfos, order, chainMap);
  const initialXPositions = computeInitialXPositions(islandInfos, primaryRoot.id, order);
  const xAfterRule4 = pullSplitsTowardMerges(
    islandInfos,
    primaryRoot.id,
    order,
    rowOf,
    initialXPositions,
    chainMap,
    ancestorSets,
  );
  const mergeApproachMap = buildMergeApproachMap(islandInfos, rowOf, chainMap);
  const xFinal = reconcileXPositions(
    islandInfos,
    order,
    primaryRoot.id,
    xAfterRule4,
    mergeApproachMap,
    ancestorSets,
  );
  const yFinal = yPass(islandInfos, xFinal, rowOf, primaryRoot.id);

  return { xFinal, yFinal, rowOf };
}

interface IslandLayout {
  nodeIds: string[];
  infos: Map<string, NodeInfo>;
  xFinal: Map<string, number>;
  yFinal: Map<string, number>;
  primaryRootY: number;
}

/**
 * Island Collision Resolution
 *
 * Sort islands by their primary root y (ascending). For each island, query a
 * shared sorted interval structure (built from all already-placed islands' nodes)
 * to find the precise max bottom-Y across each node's x-range. The uniform shift
 * for the island = max(interval_query(node) + GAP - node.y) across all nodes.
 * Apply that shift, then insert this island's nodes into the shared structure.
 *
 * This is more precise than bbox-vs-bbox: two islands whose bounding boxes
 * overlap but whose actual node footprints don't will not be shifted.
 */
function resolveIslandCollisions(islands: IslandLayout[]): void {
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
      if (maxBottom === -Infinity) continue;
      const needed = maxBottom + GAP - ny;
      if (needed > maxShift) maxShift = needed;
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

// ─── Main exports ─────────────────────────────────────────────────────────────

export function analyzeLayout(graph: Graph): Map<string, LayoutNode> {
  if (Object.keys(graph.nodes).length === 0) return new Map();

  const infos = buildTopology(graph);
  const islandGroups = findIslands(infos);

  const islandLayouts: IslandLayout[] = islandGroups.map((nodeIds) => {
    const islandInfos = new Map(nodeIds.map((id) => [id, infos.get(id)!]));
    const { xFinal, yFinal } = layoutIsland(islandInfos);
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

  resolveIslandCollisions(islandLayouts);

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

export function autoformat<T extends Graph>(graph: T): T {
  const layout = analyzeLayout(graph);
  const nodes = { ...graph.nodes };
  for (const id of Object.keys(nodes)) {
    const l = layout.get(id);
    if (l) nodes[id] = { ...nodes[id], x: l.x, y: l.y };
  }
  return { ...graph, nodes };
}
