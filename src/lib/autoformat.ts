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

    // Check multi-input before checking leaf — a node with multiple parents
    // is always a merge (possibly with no outputs, i.e. a merge-leaf).
    if (nIn === 0) info.role = "root";
    else if (nIn > 1 && nOut > 1) info.role = "merge-split";
    else if (nIn > 1) info.role = "merge";
    else if (nOut > 1) info.role = "split";
    else if (nOut === 0) info.role = "leaf";
    else info.role = "simple";
  }

  return infos;
}

function isBoundary(role: NodeRole): boolean {
  return role !== "simple";
}

// Trace a chain from a boundary node through one of its output children.
// Returns [startId, ...simples, endId] where endId is the next boundary node.
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
    currentId = current.children[0]; // simple: exactly one child
  }

  return chain;
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
// Process boundary nodes in topological order. At each split, sort output chains
// by the initial y of their first child (ascending). The first unclaimed chain
// continues in the current row (spine); subsequent unclaimed chains open new rows.
// Already-claimed chain ends represent cross-row edges — no new row is opened.
// Row claiming is first-come-first-served in y-order across the whole traversal.

function assignRows(
  infos: Map<string, NodeInfo>,
  order: string[],
): Map<string, number> {
  const rowOf = new Map<string, number>();
  let nextRow = 0;

  for (const id of order) {
    const info = infos.get(id)!;
    if (info.role === "simple") continue; // simple nodes are assigned via their chain

    // Assign a row to this boundary node if it hasn't been claimed yet
    if (!rowOf.has(id)) rowOf.set(id, nextRow++);
    const currentRow = rowOf.get(id)!;

    // Sort output chains by the initial y of their first child
    const sortedChildren = [...info.children].sort(
      (a, b) => infos.get(a)!.initialY - infos.get(b)!.initialY,
    );

    let spineAssigned = false;

    for (const firstChildId of sortedChildren) {
      const chain = traceChain(id, firstChildId, infos);
      const endId = chain[chain.length - 1];

      if (rowOf.has(endId)) {
        // End boundary already claimed → cross-row edge.
        // Assign any unvisited internals to the end's row.
        const endRow = rowOf.get(endId)!;
        for (let i = 1; i < chain.length - 1; i++) {
          if (!rowOf.has(chain[i])) rowOf.set(chain[i], endRow);
        }
        continue;
      }

      // Assign a row to this chain
      const chainRow = !spineAssigned ? currentRow : nextRow++;
      if (!spineAssigned) spineAssigned = true;

      for (let i = 1; i < chain.length; i++) {
        if (!rowOf.has(chain[i])) rowOf.set(chain[i], chainRow);
      }
    }
  }

  return rowOf;
}

// ─── Step 2b: Forward Pass (minimum x positions) ─────────────────────────────
//
// Walk nodes in topological order, placing each at its minimum x.
// Rules applied: 1 (primary root anchored), 2 (merge: max parent right), 5 (sequential).
// Rules 3 and 4 are applied in the backward pass.

function forwardPass(
  infos: Map<string, NodeInfo>,
  primaryRootId: string,
  order: string[],
): Map<string, number> {
  const xFwd = new Map<string, number>();

  for (const id of order) {
    const info = infos.get(id)!;
    let x: number;

    if (id === primaryRootId) {
      x = info.initialX; // Rule 1: anchored
    } else if (info.role === "merge" || info.role === "merge-split") {
      // Rule 2: x = max(parent.right) + gap
      x =
        Math.max(
          ...info.parents.map((pid) => xFwd.get(pid)! + infos.get(pid)!.width),
        ) + GAP;
    } else if (info.parents.length === 0) {
      x = 0; // secondary root: provisional, adjusted by rule 4
    } else {
      // Rule 5: sequential
      const prevId = info.parents[0];
      x = xFwd.get(prevId)! + infos.get(prevId)!.width + GAP;
    }

    xFwd.set(id, x);
  }

  return xFwd;
}

// ─── Step 2c: Rule 4 — Split Pulls ───────────────────────────────────────────

// Check whether splitId is an ancestor of nodeId (i.e. there is a forward path
// from splitId to nodeId). Walks backward through parents.
function isAncestor(
  nodeId: string,
  splitId: string,
  infos: Map<string, NodeInfo>,
  visited: Set<string> = new Set(),
): boolean {
  if (nodeId === splitId) return true;
  if (visited.has(nodeId)) return false;
  visited.add(nodeId);
  return infos
    .get(nodeId)!
    .parents.some((pid) => isAncestor(pid, splitId, infos, visited));
}

// For merge M and split S: M is independent of S if the external parents of M
// (those not downstream of S) STRICTLY dominate its internal parents (those
// downstream of S, including S itself). A tie means increasing S.right would
// break the tie and raise M.x_fwd — so M is NOT independent.
function isIndependent(
  mergeId: string,
  splitId: string,
  infos: Map<string, NodeInfo>,
  xFwd: Map<string, number>,
): boolean {
  const mergeInfo = infos.get(mergeId)!;

  let maxExternal = -Infinity; // max right of parents NOT downstream of S
  let maxInternal = -Infinity; // max right of parents downstream of S (incl. S itself)

  for (const pid of mergeInfo.parents) {
    const right = xFwd.get(pid)! + infos.get(pid)!.width;
    if (isAncestor(pid, splitId, infos)) {
      maxInternal = Math.max(maxInternal, right);
    } else {
      maxExternal = Math.max(maxExternal, right);
    }
  }

  return maxExternal > maxInternal; // strictly greater: external path dominates
}

// Apply rule 4 in reverse topological order.
// For each split (or secondary root), find the most constraining independent
// downstream merge reachable via a direct chain, and pull the split toward it.
function applyRule4(
  infos: Map<string, NodeInfo>,
  xFwd: Map<string, number>,
  order: string[],
  primaryRootId: string,
): Map<string, number> {
  const x = new Map(xFwd);

  for (const id of [...order].reverse()) {
    const info = infos.get(id)!;

    const isSplit = info.role === "split";
    const isSecondaryRoot = info.role === "root" && id !== primaryRootId;
    if (!isSplit && !isSecondaryRoot) continue;

    // Find the most constraining independent merge reachable via a direct chain
    let bestPull = -Infinity;

    for (const firstChildId of info.children) {
      const chain = traceChain(id, firstChildId, infos);
      const endId = chain[chain.length - 1];
      const endInfo = infos.get(endId)!;

      if (endInfo.role !== "merge" && endInfo.role !== "merge-split") continue;
      if (!isIndependent(endId, id, infos, xFwd)) continue;

      // min_direct_path_width = this.width + sum(internal widths) + (n+1) * gap
      let internalsWidth = 0;
      for (let i = 1; i < chain.length - 1; i++) {
        internalsWidth += infos.get(chain[i])!.width;
      }
      const nInternals = chain.length - 2;
      const minPathWidth = info.width + internalsWidth + (nInternals + 1) * GAP;

      const pull = xFwd.get(endId)! - minPathWidth;
      if (pull > bestPull) bestPull = pull;
    }

    if (bestPull === -Infinity) continue; // no valid independent merge

    const prevId = info.parents[0];
    const finalX = prevId
      ? Math.max(x.get(prevId)! + infos.get(prevId)!.width + GAP, bestPull)
      : bestPull; // secondary root: pull alone (can be negative)

    if (finalX === x.get(id)) continue;
    x.set(id, finalX);

    // Propagate updated x through sequential (simple) chain nodes; stop at boundaries
    const startRight = finalX + info.width;
    for (const childId of info.children) {
      propagateSimple(childId, startRight, x, infos);
    }
  }

  return x;
}

function propagateSimple(
  id: string,
  prevRight: number,
  x: Map<string, number>,
  infos: Map<string, NodeInfo>,
) {
  const info = infos.get(id)!;
  if (isBoundary(info.role)) return; // boundary nodes keep their x

  const newX = prevRight + GAP;
  x.set(id, newX);

  for (const childId of info.children) {
    propagateSimple(childId, newX + info.width, x, infos);
  }
}

// ─── Main exports ─────────────────────────────────────────────────────────────

export function analyzeLayout(graph: Graph): Map<string, LayoutNode> {
  if (Object.keys(graph.nodes).length === 0) return new Map();

  const infos = buildTopology(graph);
  const order = topologicalSort(infos);

  const primaryRoot = [...infos.values()]
    .filter((n) => n.role === "root")
    .sort((a, b) => a.initialY - b.initialY)[0];

  const rowOf = assignRows(infos, order);
  const xFwd = forwardPass(infos, primaryRoot.id, order);
  const xFinal = applyRule4(infos, xFwd, order, primaryRoot.id);

  // After rule 4 pulls splits, re-run rule 2 in topological order so that
  // merges which depend on the moved splits get their x updated.
  for (const id of order) {
    const info = infos.get(id)!;
    if (info.role !== "merge" && info.role !== "merge-split") continue;
    xFinal.set(
      id,
      Math.max(
        ...info.parents.map((pid) => xFinal.get(pid)! + infos.get(pid)!.width),
      ) + GAP,
    );
  }

  const result = new Map<string, LayoutNode>();
  for (const info of infos.values()) {
    result.set(info.id, {
      id: info.id,
      x: xFinal.get(info.id)!,
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
  // Steps 3 + 4 (Y pass) not yet implemented — returns graph with x-positions only
  const layout = analyzeLayout(graph);
  const nodes = { ...graph.nodes };
  for (const id of Object.keys(nodes)) {
    const l = layout.get(id);
    if (l) nodes[id] = { ...nodes[id], x: l.x };
  }
  return { ...graph, nodes };
}
