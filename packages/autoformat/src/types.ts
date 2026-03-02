import type { Edges, Nodes } from "@audiograph/create-graph";

export type NodeRole =
  | "root"
  | "leaf"
  | "simple"
  | "split"
  | "merge"
  | "merge-split";

export interface NodeInfo {
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

export interface Graph {
  nodes: Nodes;
  edges: Edges;
}

export interface AutoformatOptions {
  gap: number;
}

export interface AnalysisResult {
  infos: Map<string, NodeInfo>;
  order: string[];
  chainMap: Map<string, Map<string, string[]>>;
  ancestorSets: Map<string, Set<string>>;
  primaryRoot: NodeInfo;
  rowOf: Map<string, number>;
  mergeApproachMap: Map<string, { endId: string; prevId: string; startId: string }>;
  rowOrder: number[];
}

export interface IslandLayout {
  nodeIds: string[];
  infos: Map<string, NodeInfo>;
  xFinal: Map<string, number>;
  yFinal: Map<string, number>;
  primaryRootY: number;
}

export function isMergeLike(role: NodeRole): boolean {
  return role === "merge" || role === "merge-split";
}

/**
 * A "boundary" node is any non-simple node (root, leaf, split, merge, merge-split).
 * Chains run between boundary nodes; simple nodes are interior to chains.
 */
export function isBoundary(role: NodeRole): boolean {
  return role !== "simple";
}

/**
 * Sorted interval structure for efficient max-bottom-Y queries over x-ranges.
 * Used by both the y-pass (row placement) and island collision resolution.
 */
export class IntervalStructure {
  private intervals: Array<{
    xStart: number;
    xEnd: number;
    topY: number;
    bottomY: number;
  }> = [];
  private baseBottomY: number;

  constructor(baseBottomY = -Infinity) {
    this.baseBottomY = baseBottomY;
  }

  insert(xStart: number, xEnd: number, topY: number, bottomY: number) {
    const iv = { xStart, xEnd, topY, bottomY };
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

  /** Like queryMaxBottomY but only considers intervals that collide in y. */
  queryMaxBottomYColliding(
    xStart: number,
    xEnd: number,
    nodeTopY: number,
    nodeBottomY: number,
    gap: number,
  ): number {
    let max = this.baseBottomY;
    for (const iv of this.intervals) {
      if (iv.xStart >= xEnd) break;
      if (iv.xEnd > xStart) {
        const safelyAbove = nodeBottomY + gap <= iv.topY;
        const safelyBelow = nodeTopY >= iv.bottomY + gap;
        if (!safelyAbove && !safelyBelow && iv.bottomY > max) {
          max = iv.bottomY;
        }
      }
    }
    return max;
  }
}
