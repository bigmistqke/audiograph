import type { Graph } from "./graph/create-graph-api";

const GAP = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Step 1: Topology Analysis ────────────────────────────────────────────────

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
      width: node.dimensions.x,
      height: node.dimensions.y,
    });
  }

  // Build adjacency — deduplicate multi-port connections between the same node pair
  const parentSets = new Map<string, Set<string>>();
  const childSets = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
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

function isMergeLike(role: NodeRole): boolean {
  return role === "merge" || role === "merge-split";
}

// A "boundary" node is any non-simple node (root, leaf, split, merge, merge-split).
// Chains run between boundary nodes; simple nodes are interior to chains.
function isBoundary(role: NodeRole): boolean {
  return role !== "simple";
}

// Trace a chain from a boundary node through one of its output children.
// Returns [startId, ...simpleInteriors, endBoundaryId].
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

// ─── Chain Precomputation ─────────────────────────────────────────────────────
//
// Trace all chains once after topology analysis. Stores chains as:
//   chainMap: startBoundaryId → (firstChildId → chain[])
// All later passes use chainMap.get(startId)!.get(firstChildId)! instead of
// calling traceChain() on every traversal.

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

// ─── Topological sort (Kahn's) ────────────────────────────────────────────────

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

// ─── Step 2a: Row Assignment ──────────────────────────────────────────────────
//
// Process boundary nodes in topological order. At each node, sort output chains
// by the initial y of their first child (ascending). The first unclaimed chain
// continues in the current row (spine); subsequent unclaimed chains open new rows.
// Already-claimed chain ends represent cross-row edges — no new row is opened.
// Row claiming is first-come-first-served in y-order across the whole traversal.

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
        if (isMergeLike(infos.get(endId)!.role) && chainRow < rowOf.get(endId)!) {
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

// ─── Step 2b: Forward Pass ────────────────────────────────────────────────────
//
// Walk nodes in topological order, placing each at its provisional x.
//
// Rule 1: primary root → anchored to current user position.
// Rule 2: merge/merge-split → max(parent.right for ALL parents) + gap.
// Rule 5: all others → prev.right + gap (secondary roots start at 0).

function forwardPass(
  infos: Map<string, NodeInfo>,
  primaryRootId: string,
  order: string[],
  rowOf: Map<string, number>,
): Map<string, number> {
  const x = new Map<string, number>();

  for (const id of order) {
    const info = infos.get(id)!;

    if (id === primaryRootId) {
      x.set(id, info.initialX); // Rule 1: anchored
    } else if (isMergeLike(info.role)) {
      // Rule 2: max of all parents' right edges + gap
      x.set(
        id,
        Math.max(...info.parents.map((pid) => x.get(pid)! + infos.get(pid)!.width)) +
          GAP,
      );
    } else if (info.parents.length === 0) {
      x.set(id, 0); // secondary root: provisional, adjusted by Rule 4
    } else {
      // Rule 5: sequential from single parent
      const prevId = info.parents[0];
      x.set(id, x.get(prevId)! + infos.get(prevId)!.width + GAP);
    }
  }

  return x;
}

// ─── Descendant Check ─────────────────────────────────────────────────────────

function isDescendantOf(
  nodeId: string,
  ancestorId: string,
  infos: Map<string, NodeInfo>,
  cache: Map<string, boolean>,
): boolean {
  if (nodeId === ancestorId) return true;
  const key = `${nodeId}|${ancestorId}`;
  if (cache.has(key)) return cache.get(key)!;
  const result = infos
    .get(nodeId)!
    .parents.some((p) => isDescendantOf(p, ancestorId, infos, cache));
  cache.set(key, result);
  return result;
}

// ─── x_excl Computation ───────────────────────────────────────────────────────
//
// For merge M and split S: compute M's x-position excluding S's subtree entirely.
// x_excl = max(right-edges of M's parents NOT downstream of S) + GAP.
// Returns -Infinity if M has no external parents (M is not independent of S).

function computeXExcl(
  mergeId: string,
  splitId: string,
  infos: Map<string, NodeInfo>,
  x: Map<string, number>,
  descCache: Map<string, boolean>,
): number {
  let maxExternal = -Infinity;
  for (const pid of infos.get(mergeId)!.parents) {
    if (isDescendantOf(pid, splitId, infos, descCache)) continue;
    const right = x.get(pid)! + infos.get(pid)!.width;
    if (right > maxExternal) maxExternal = right;
  }
  if (maxExternal === -Infinity) return -Infinity; // not independent
  return maxExternal + GAP;
}

// ─── Propagate Sequential ────────────────────────────────────────────────────
//
// After a split is pulled, propagate the new x through simple and leaf nodes
// downstream. Stop at merge/split/merge-split boundaries (they have their own
// placement rules). Leaves ARE updated (they use Rule 5 like simple nodes).

function propagateSequential(
  id: string,
  prevRight: number,
  x: Map<string, number>,
  infos: Map<string, NodeInfo>,
) {
  const info = infos.get(id)!;
  // Stop at true boundary types that have their own rules
  if (isMergeLike(info.role) || info.role === "split" || info.role === "root") return;

  x.set(id, prevRight + GAP);
  for (const childId of info.children) {
    propagateSequential(childId, prevRight + GAP + info.width, x, infos);
  }
}

// ─── Step 2c: Find Best Rule 4 Pull ──────────────────────────────────────────
//
// Multi-hop path traversal from splitId to find the most constraining
// independent merge target.
//
// Priority:
//   - PRIMARY: first merge with strictly smaller row index (higher priority)
//     encountered along each path. Stop traversal at primary targets.
//   - FALLBACK: merges in same or lower-priority rows. Continue traversal
//     through them to look for deeper primary targets.
//   - Same-priority merges: skip as target, continue traversal through them.
//
// pathWidthSoFar tracks: sum(widths of [splitId..currentBoundary]) + count×GAP.
// This equals the minimum horizontal span from S's left edge to place the next
// node right after currentBoundary.

function findBestRule4Pull(
  splitId: string,
  infos: Map<string, NodeInfo>,
  rowOf: Map<string, number>,
  x: Map<string, number>,
  descCache: Map<string, boolean>,
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
        // Leaf or other: no target, don't continue.
        continue;
      }

      const endRow = rowOf.get(endId) ?? 0;
      const xExcl = computeXExcl(endId, splitId, infos, x, descCache);

      if (endRow < splitRow) {
        // PRIMARY target: strictly higher-priority row.
        if (xExcl !== -Infinity) {
          const pull = xExcl - pathWidthToEnd;
          if (pull > bestPrimaryPull) bestPrimaryPull = pull;
        }
        // Stop this path here (don't traverse past a primary target).
      } else if (endRow === splitRow) {
        // Same priority: valid fallback target if no primary is found; also continue traversal.
        if (xExcl !== -Infinity) {
          const pull = xExcl - pathWidthToEnd;
          if (pull > bestFallbackPull) bestFallbackPull = pull;
        }
        visitedBoundaries.add(endId);
        traverse(endId, pathWidthToEnd + endInfo.width + GAP);
      } else {
        // FALLBACK target: lower-priority row.
        if (xExcl !== -Infinity) {
          const pull = xExcl - pathWidthToEnd;
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

// ─── Step 2c: Apply All Rule 4 Pulls ─────────────────────────────────────────
//
// 1. Process splits in reverse topological order (post-order approximation).
// 2. Process secondary roots in y-order (smallest y first), using current
//    positions — this ensures later secondary roots see updated x_excl values
//    from already-placed earlier ones.

function applyRule4(
  infos: Map<string, NodeInfo>,
  primaryRootId: string,
  order: string[],
  rowOf: Map<string, number>,
  xFwd: Map<string, number>,
  chainMap: Map<string, Map<string, string[]>>,
): Map<string, number> {
  const x = new Map(xFwd);
  const descCache = new Map<string, boolean>();

  // Splits: reverse topological order ≈ post-order DFS
  for (const id of [...order].reverse()) {
    const info = infos.get(id)!;
    if (info.role !== "split") continue;

    const pull = findBestRule4Pull(id, infos, rowOf, x, descCache, chainMap);
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

  // Secondary roots: process in y-order (smallest y, tie-break smallest x).
  // Each uses the current x map so it sees positions set by earlier secondary roots.
  const secondaryRoots = [...infos.values()]
    .filter((info) => info.role === "root" && info.id !== primaryRootId)
    .sort((a, b) => a.initialY - b.initialY || a.initialX - b.initialX);

  for (const rootInfo of secondaryRoots) {
    const id = rootInfo.id;

    const pull = findBestRule4Pull(id, infos, rowOf, x, descCache, chainMap);
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

  return x;
}

// ─── Rule 3: Node Identification ─────────────────────────────────────────────
//
// Rule 3 applies to the LAST INTERNAL node in a chain where the end boundary is
// a merge/merge-split in a strictly HIGHER-PRIORITY row than the chain's start.
//
// For such a node: x = max(prev.right + gap, end.x - width - gap)
// where "prev" is the node immediately before it in the chain.

function computeRule3Map(
  infos: Map<string, NodeInfo>,
  rowOf: Map<string, number>,
  chainMap: Map<string, Map<string, string[]>>,
): Map<string, { endId: string; prevId: string; startId: string }> {
  const rule3Map = new Map<string, { endId: string; prevId: string; startId: string }>();

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
      if (!rule3Map.has(lastInternalId)) {
        // prev = node just before lastInternal in the chain
        const prevId =
          chain.length >= 4 ? chain[chain.length - 3] : info.id;
        rule3Map.set(lastInternalId, { endId, prevId, startId: info.id });
      }
    }
  }

  return rule3Map;
}

// ─── Step 3: Reconcile Pass ───────────────────────────────────────────────────
//
// After all Rule 4 pulls, recompute all non-fixed nodes in topological order:
//   - Rule 3: last internal before higher-priority merge
//   - Rule 2 (row-filtered): merge/merge-split
//   - Rule 5: simple and leaf nodes
//
// Fixed nodes (keep as-is): primary root, splits, secondary roots.
// Topological order guarantees parents are computed before children.

function reconcilePass(
  infos: Map<string, NodeInfo>,
  order: string[],
  rowOf: Map<string, number>,
  primaryRootId: string,
  x: Map<string, number>,
  rule3Map: Map<string, { endId: string; prevId: string; startId: string }>,
): Map<string, number> {
  const result = new Map(x);
  const descCache = new Map<string, boolean>();

  for (const id of order) {
    const info = infos.get(id)!;

    // Fixed: primary root, splits, and secondary roots (all placed by Rules 1/4)
    if (id === primaryRootId) continue;
    if (info.role === "root") continue; // secondary roots
    if (info.role === "split") continue;

    // Rule 3: last internal before a higher-priority merge.
    // Use x_excl to avoid circular dependency: endId's Rule 2 position may
    // include this node as a parent, so we exclude the chain's startId subtree.
    if (rule3Map.has(id)) {
      const { endId, prevId, startId } = rule3Map.get(id)!;
      const prevRight = result.get(prevId)! + infos.get(prevId)!.width;
      const xExcl = computeXExcl(endId, startId, infos, result, descCache);
      const pullTarget = xExcl !== -Infinity ? xExcl - info.width - GAP : -Infinity;
      result.set(id, pullTarget !== -Infinity ? Math.max(prevRight + GAP, pullTarget) : prevRight + GAP);
      continue;
    }

    // Rule 2: merge/merge-split — max of all parents' right edges + gap
    if (isMergeLike(info.role)) {
      result.set(
        id,
        Math.max(
          ...info.parents.map((pid) => result.get(pid)! + infos.get(pid)!.width),
        ) + GAP,
      );
      continue;
    }

    // Rule 5: simple and leaf — sequential from single parent
    if (info.parents.length === 1) {
      const prevId = info.parents[0];
      result.set(id, result.get(prevId)! + infos.get(prevId)!.width + GAP);
    }
  }

  return result;
}

// ─── Step 3 + 4: DFS Row Order + Y Pass ──────────────────────────────────────
//
// Step 3: build an interval structure (list of {xStart, xEnd, bottomY} tuples)
//   - insert(xStart, xEnd, bottomY): record a placed row's x-span and bottom edge
//   - queryMaxBottomY(xStart, xEnd): max bottom-Y across all overlapping intervals
//
// Step 4: process rows in DFS order (NOT row-index order). The DFS starts at
// the primary root, visits children sorted by initialY ascending, fully
// exhausting each subtree before the next sibling. Secondary roots follow in
// top-left order. The first time a row is encountered in this traversal is
// when it is placed.
//
// Row y = max_bottom_y_across_x_span + GAP.
// Row height = max(node heights in row). Gap = 30px.
// Primary root anchoring: interval structure is seeded so that row 0 lands at
// primaryRoot.initialY (i.e. baseBottomY = primaryRoot.initialY - GAP).

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
  const baseBottomY = infos.get(primaryRootId)!.initialY - GAP;

  // Interval structure: list of {xStart, xEnd, bottomY}
  const intervals: Array<{ xStart: number; xEnd: number; bottomY: number }> = [];

  function queryMaxBottomY(xStart: number, xEnd: number): number {
    let max = baseBottomY;
    for (const iv of intervals) {
      if (iv.xEnd > xStart && iv.xStart < xEnd) {
        if (iv.bottomY > max) max = iv.bottomY;
      }
    }
    return max;
  }

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

    const y = queryMaxBottomY(xMin, xMax) + GAP;

    for (const id of nodeIds) {
      yOut.set(id, y);
    }

    // Insert per-node intervals using each node's own height.
    // This lets nodes in adjacent columns (non-overlapping x-ranges) avoid
    // being blocked by the tallest node in the row.
    for (const id of nodeIds) {
      const nodeX = xFinal.get(id)!;
      const info = infos.get(id)!;
      intervals.push({ xStart: nodeX, xEnd: nodeX + info.width, bottomY: y + info.height });
    }
  }

  return yOut;
}

// ─── Main exports ─────────────────────────────────────────────────────────────

export function analyzeLayout(graph: Graph): Map<string, LayoutNode> {
  if (Object.keys(graph.nodes).length === 0) return new Map();

  const infos = buildTopology(graph);
  const order = topologicalSort(infos);
  const chainMap = buildChainMap(infos);

  // Primary root: most top-left (smallest y, tie-break smallest x)
  const primaryRoot = [...infos.values()]
    .filter((n) => n.role === "root")
    .sort((a, b) => a.initialY - b.initialY || a.initialX - b.initialX)[0];

  const rowOf = assignRows(infos, order, chainMap);
  const xFwd = forwardPass(infos, primaryRoot.id, order, rowOf);
  const xAfterRule4 = applyRule4(infos, primaryRoot.id, order, rowOf, xFwd, chainMap);
  const rule3Map = computeRule3Map(infos, rowOf, chainMap);
  const xFinal = reconcilePass(
    infos,
    order,
    rowOf,
    primaryRoot.id,
    xAfterRule4,
    rule3Map,
  );

  const yFinal = yPass(infos, xFinal, rowOf, primaryRoot.id);

  const result = new Map<string, LayoutNode>();
  for (const info of infos.values()) {
    result.set(info.id, {
      id: info.id,
      x: xFinal.get(info.id)!,
      y: yFinal.get(info.id)!,
      row: rowOf.get(info.id) ?? 0,
      width: info.width,
      height: info.height,
    });
  }

  return result;
}

export function analyze(graph: Graph) {
  return analyzeLayout(graph);
}

export function autoformat(graph: Graph): Graph {
  const layout = analyzeLayout(graph);
  const nodes = { ...graph.nodes };
  for (const id of Object.keys(nodes)) {
    const l = layout.get(id);
    if (l) nodes[id] = { ...nodes[id], x: l.x, y: l.y };
  }
  return { ...graph, nodes };
}
