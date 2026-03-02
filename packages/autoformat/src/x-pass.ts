import { assertedNotNullish } from "@audiograph/utils";
import {
  isMergeLike,
  type AnalysisResult,
  type AutoformatOptions,
  type NodeInfo,
} from "./types";

/**
 * Compute provisional x-positions for all nodes in topological order.
 *
 * Placement rules:
 *   - `Anchor rule`
 *     - primary root: anchored to current user position.
 *   - `Merge Alignment rule`
 *     - merge/merge-split: max(parent.right for ALL parents) + gap.
 *   - `Sequential rule`
 *     - all others: prev.right + gap
 *     - secondary roots start at 0.
 */
function computeInitialXPositions(
  ctx: AnalysisResult,
  options: AutoformatOptions,
): Map<string, number> {
  const { infos, order, primaryRoot } = ctx;
  const x = new Map<string, number>();

  for (const id of order) {
    const info = infos.get(id)!;

    // Anchor rule
    if (id === primaryRoot.id) {
      x.set(id, info.initialX);
      continue;
    }

    // Merge Alignment: max of all parents' right edges + gap
    if (isMergeLike(info.role)) {
      let maxRight = -Infinity;

      for (const pid of info.parents) {
        const right = x.get(pid)! + infos.get(pid)!.width;
        if (right > maxRight) maxRight = right;
      }

      x.set(id, maxRight + options.gap);

      continue;
    }

    // secondary root: provisional, will be adjusted by Split Pull
    if (info.parents.length === 0) {
      x.set(id, 0);

      continue;
    }

    // Sequential: from single parent
    const prevId = info.parents[0];
    const prevInfo = infos.get(prevId)!;
    x.set(id, x.get(prevId)! + prevInfo.width + options.gap);
  }

  return x;
}

/**
 * Compute a merge's x-position considering only parents outside a split's subtree.
 *
 * For merge M and split S: max(right-edges of M's parents NOT downstream of S) + GAP.
 * Returns -Infinity if M has no external parents (i.e. M is not independent of S).
 *
 * ```
 * Independent — M has a parent outside S's subtree:
 *
 * [X]──>[Y]──>[Z]──>[M]       M's parents: Z and C
 *                    ↑         Z is NOT downstream of S → keep
 * [S]──>[B]──>[C]────┘         C IS downstream of S → skip
 *
 * Result: Z.right + GAP  (where M would be without S's branch)
 *
 * Not independent — all of M's parents are downstream of S:
 *
 *      ┌──>[B]──┐
 * [S]──┤        ├──>[M]        M's parents: B and C
 *      └──>[C]──┘              Both downstream of S → skip all
 *
 * Result: -Infinity  (M depends entirely on S, no pull target)
 * ```
 */
function computeMergeXWithoutSubtree(
  ctx: AnalysisResult,
  mergeId: string,
  splitId: string,
  x: Map<string, number>,
  options: AutoformatOptions,
): number {
  const { infos, ancestorSets } = ctx;
  let maxExternal = -Infinity;

  for (const pid of infos.get(mergeId)!.parents) {
    if (pid === splitId || ancestorSets.get(pid)!.has(splitId)) {
      continue;
    }

    const right = x.get(pid)! + infos.get(pid)!.width;

    if (right > maxExternal) {
      maxExternal = right;
    }
  }

  if (maxExternal === -Infinity) {
    return -Infinity; // not independent
  }

  return maxExternal + options.gap;
}

/**
 * Propagate Sequential
 *
 * After a split is pulled, propagate the new x through simple and leaf nodes
 * downstream. Stop at merge/split/merge-split boundaries (they have their own
 * placement rules). Leaves ARE updated (Sequential rule, like simple nodes).
 */
function propagateSequential(
  nodeId: string,
  prevRight: number,
  x: Map<string, number>,
  infos: Map<string, NodeInfo>,
  options: AutoformatOptions,
) {
  const info = assertedNotNullish(
    infos.get(nodeId),
    `Expected infos to contain ${nodeId}`,
  );

  // Stop at true boundary types that have their own rules
  if (isMergeLike(info.role) || info.role === "split" || info.role === "root") {
    return;
  }

  x.set(nodeId, prevRight + options.gap);

  for (const childId of info.children) {
    propagateSequential(
      childId,
      prevRight + options.gap + info.width,
      x,
      infos,
      options,
    );
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
 * pathWidthSoFar tracks: sum(widths of [splitId..currentBoundary]) + count*gap.
 * This equals the minimum horizontal span from S's left edge to place the next
 * node right after currentBoundary.
 */
function findMergePullTarget(
  ctx: AnalysisResult,
  splitId: string,
  x: Map<string, number>,
  options: AutoformatOptions,
): number {
  const { infos, rowOf, chainMap } = ctx;
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

      if (visitedBoundaries.has(endId)) {
        continue;
      }

      // Accumulate path width: internals contribute width + gap each.
      // pathWidthSoFar already includes currentBoundary width + 1 gap.
      let internalsWidth = 0;
      for (let i = 1; i < chain.length - 1; i++) {
        internalsWidth += infos.get(chain[i])!.width;
      }

      const nInternals = chain.length - 2;
      const pathWidthToEnd =
        pathWidthSoFar + internalsWidth + nInternals * options.gap;

      const endInfo = infos.get(endId)!;
      if (!isMergeLike(endInfo.role)) {
        // Split: no pull target here, but continue traversal to find deeper merges.
        if (endInfo.role === "split") {
          visitedBoundaries.add(endId);
          traverse(endId, pathWidthToEnd + endInfo.width + options.gap);
        }

        continue;
      }

      const endRow = rowOf.get(endId) ?? 0;
      const xWithoutSubtree = computeMergeXWithoutSubtree(
        ctx,
        endId,
        splitId,
        x,
        options,
      );

      if (endRow < splitRow) {
        // PRIMARY target: strictly higher-priority row.
        if (xWithoutSubtree !== -Infinity) {
          const pull = xWithoutSubtree - pathWidthToEnd;
          if (pull > bestPrimaryPull) bestPrimaryPull = pull;
        }

        // Stop this path here (don't traverse past a primary target).
        continue;
      }

      if (endRow === splitRow) {
        // Same priority: continue traversal to find deeper targets.
        // Only record this target's pull if no deeper target is found
        // (the deepest target on a chain is the most constraining).
        const savedPrimary = bestPrimaryPull;
        const savedFallback = bestFallbackPull;

        visitedBoundaries.add(endId);
        traverse(endId, pathWidthToEnd + endInfo.width + options.gap);

        const deeperFound =
          bestPrimaryPull !== savedPrimary ||
          bestFallbackPull !== savedFallback;

        if (!deeperFound && xWithoutSubtree !== -Infinity) {
          const pull = xWithoutSubtree - pathWidthToEnd;
          if (pull > bestFallbackPull) bestFallbackPull = pull;
        }

        continue;
      }

      // FALLBACK target: lower-priority row.
      if (xWithoutSubtree !== -Infinity) {
        const pull = xWithoutSubtree - pathWidthToEnd;
        if (pull > bestFallbackPull) bestFallbackPull = pull;
      }

      // Continue through fallback to look for primary targets deeper.
      visitedBoundaries.add(endId);
      traverse(endId, pathWidthToEnd + endInfo.width + options.gap);
    }
  }

  // Initial path width: splitId's width + 1 gap (ready for the next node).
  traverse(splitId, splitWidth + options.gap);

  // Primary targets take precedence over fallback targets.
  if (bestPrimaryPull !== -Infinity) {
    return bestPrimaryPull;
  }

  if (bestFallbackPull !== -Infinity) {
    return bestFallbackPull;
  }

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
  ctx: AnalysisResult,
  initialXPositions: Map<string, number>,
  options: AutoformatOptions,
): { x: Map<string, number>; pulledSplits: Set<string> } {
  const { infos, primaryRoot, order } = ctx;
  const x = new Map(initialXPositions);
  const pulledSplits = new Set<string>();

  // Secondary roots: process first (y-order) so their splits see the updated x
  // when processed below. Each uses the current x map so it sees positions set
  // by earlier secondary roots.
  const secondaryRoots = [...infos.values()]
    .filter((info) => info.role === "root" && info.id !== primaryRoot.id)
    .sort((a, b) => a.initialY - b.initialY || a.initialX - b.initialX);

  for (const rootInfo of secondaryRoots) {
    const id = rootInfo.id;

    const pull = findMergePullTarget(ctx, id, x, options);

    if (pull === -Infinity) {
      continue;
    }

    // Secondary roots have no prev — pull alone determines x (can be negative).
    const finalX = pull;

    if (finalX === x.get(id)) {
      continue;
    }

    x.set(id, finalX);
    const rootRight = finalX + rootInfo.width;

    for (const childId of rootInfo.children) {
      propagateSequential(childId, rootRight, x, infos, options);
    }
  }

  // Splits: reverse topological order ≈ post-order DFS.
  // Processed after secondary roots so single-parent splits use their parent's
  // updated x (set above) as the lower bound.
  for (const id of [...order].reverse()) {
    const info = infos.get(id)!;

    if (info.role !== "split") {
      continue;
    }

    const pull = findMergePullTarget(ctx, id, x, options);

    if (pull === -Infinity) {
      continue;
    }

    const prevId = info.parents[0];
    const finalX = prevId
      ? Math.max(x.get(prevId)! + infos.get(prevId)!.width + options.gap, pull)
      : pull;

    if (finalX === x.get(id)) {
      // Only mark as pulled if the pull target (not the parent constraint) determined
      // the position. If the parent was the binding factor, don't freeze this split:
      // the parent may be a merge that gets recomputed in the reconcile phase.
      const parentRight = prevId
        ? x.get(prevId)! + infos.get(prevId)!.width + options.gap
        : -Infinity;

      if (pull >= parentRight) {
        pulledSplits.add(id);
      }

      continue;
    }

    x.set(id, finalX);
    pulledSplits.add(id);

    // Propagate updated x through sequential nodes in this split's chains.
    const splitRight = finalX + info.width;

    for (const childId of info.children) {
      propagateSequential(childId, splitRight, x, infos, options);
    }
  }

  return { x, pulledSplits };
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
  ctx: AnalysisResult,
  x: Map<string, number>,
  options: AutoformatOptions,
  pulledSplits: Set<string>,
): Map<string, number> {
  const { infos, order, primaryRoot, mergeApproachMap } = ctx;
  const result = new Map(x);

  for (const id of order) {
    const info = infos.get(id)!;

    // Fixed: primary root, splits, and secondary roots (placed by Anchor/Split Pull)
    if (id === primaryRoot.id) {
      continue;
    }

    if (info.role === "root") {
      continue; // secondary roots
    }

    if (info.role === "split" && pulledSplits.has(id)) {
      continue;
    }

    // Merge Approach: last internal before a higher-priority merge.
    // Use xWithoutSubtree to avoid circular dependency: endId's Merge Alignment position may
    // include this node as a parent, so we exclude the chain's startId subtree.
    if (mergeApproachMap.has(id)) {
      const { endId, prevId, startId } = mergeApproachMap.get(id)!;
      const prevInfo = infos.get(prevId)!;
      const prevRight = result.get(prevId)! + prevInfo.width;
      const xWithoutSubtree = computeMergeXWithoutSubtree(
        ctx,
        endId,
        startId,
        result,
        options,
      );
      const pullTarget =
        xWithoutSubtree !== -Infinity
          ? xWithoutSubtree - info.width - options.gap
          : -Infinity;

      result.set(
        id,
        pullTarget !== -Infinity
          ? Math.max(prevRight + options.gap, pullTarget)
          : prevRight + options.gap,
      );

      continue;
    }

    // Merge Alignment: max of all parents' right edges + gap
    if (isMergeLike(info.role)) {
      let maxRight = -Infinity;

      for (const pid of info.parents) {
        const right = result.get(pid)! + infos.get(pid)!.width;

        if (right > maxRight) {
          maxRight = right;
        }
      }

      result.set(id, maxRight + options.gap);

      continue;
    }

    // Sequential: simple and leaf — from single parent
    if (info.parents.length === 1) {
      const prevId = info.parents[0];
      const prevInfo = infos.get(prevId)!;
      result.set(id, result.get(prevId)! + prevInfo.width + options.gap);
    }
  }

  return result;
}

/**
 * Run the full x-positioning pipeline: initial placement → split pull → reconcile.
 */
export function xPass(
  ctx: AnalysisResult,
  options: AutoformatOptions,
): Map<string, number> {
  const initialXPositions = computeInitialXPositions(ctx, options);
  const { x: xAfterSplitPull, pulledSplits } = pullSplitsTowardMerges(
    ctx,
    initialXPositions,
    options,
  );
  return reconcileXPositions(ctx, xAfterSplitPull, options, pulledSplits);
}
