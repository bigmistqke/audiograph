# Autoformat Algorithm Spec

## Thesis

This algorithm is **prettier for audio graphs**.

Prettier takes messy code and reformats it into a clean, consistent structure — but it isn't purely mechanical. It respects some of your intent: if you put arguments on separate lines, prettier keeps them on separate lines. It's opinionated about *structure*, deferential about *ordering*.

This algorithm does the same thing for graphs:
- **Opinionated about structure**: nodes snap to a clean grid, x-positions follow strict alignment rules, y-positions are computed from a spatial interval structure.
- **Deferential about ordering**: the user's current y-positions of branch-start nodes determine which row each branch lands in. If you put one branch below another, the algorithm keeps it there.

The result is a layout that is always tidy, but still feels like *yours*.

---

## Terminology

### Node Types
- **Simple node**: exactly one input, one output
- **Split node**: one input (or root), multiple outputs
- **Merge node**: multiple inputs, one output (or leaf)
- **Merge-split node**: multiple inputs AND multiple outputs

### Chain

A **chain** is a linear sequence of nodes where:
- The **first** and **last** nodes are boundary nodes (split, merge, merge-split, root, or leaf)
- All **internal** nodes are simple nodes (exactly one parent, one child)
- Boundary nodes are **included** as the first/last node of the chain

A chain runs from one boundary node to the next. Every simple node belongs to exactly one chain. Boundary nodes can appear as the endpoint of multiple chains (as the start of one and the end of another).

Zero-internal chains like `[A, B]` are valid — two boundary nodes directly connected, no internals between them.

**Examples:**
- `[A, D, E, C]` — A (split) → D (simple) → E (simple) → C (merge)
- `[A, B]` — A (split) → B (split), no internals
- `[B]` — a merge-split as a single-node chain

### Row

A **row** is a set of chains that share the same top-Y coordinate. Two chains cannot share a row if their x-ranges overlap.

Row ordering is determined by the **user's current y-positions of branch-start nodes** at each split: lower y = earlier row. This is the mechanism by which user intent is preserved — the relative vertical ordering of branches is respected, not recomputed from topology.

Row assignment is per-chain, not per-node. A boundary node that starts multiple chains has no single "home row"; each chain it starts may land in a different row.

---

## Algorithm

### Step 1: Topology Analysis

Identify all boundary nodes (split / merge / merge-split / root / leaf), then trace all chains between them. Compute each chain's **minimum width**: `sum(node widths) + (n-1) × gap`.

### Step 2: DFS Traversal — X-positions + Row Assignment

Row assignment and x-computation happen in a **single DFS traversal**. They are not separate phases.

**At each split node**, sort its outgoing branches by the **current y-position of each branch's first node** (ascending). Traverse branches in that order:

- The branch with the **lowest initial y** continues in the **current row** (spine continuation).
- Each subsequent branch **opens a new row** below — unless its first node is already row-assigned (claimed by a prior branch in the traversal). Already-claimed nodes represent cross-row edges; no new row is opened for them.

Row-claiming is **first-come-first-served in y-order** across the whole DFS. A node gets the row of whichever branch reaches it first — always the branch whose start had the lowest initial y, since that branch is traversed first.

**X-position** at each node is determined by the placement rules (see *X-Position Rules*). The key principle: at a **merge**, take the max of all parent right-edges (critical path). At a **split**, position to align with the most constraining independent downstream merge — the one that, if the split were placed just in time for its chain to fit, would push the split furthest right.

### Step 3: Build Spatial Data Structure

After x-positions are computed, build an **interval structure** indexed by x-range that tracks the maximum occupied bottom-Y for any x-span. Supports range queries: given `[x1, x2]`, return the maximum bottom-Y across that span.

### Step 4: Y Pass

Process rows top-to-bottom. For each chain:
1. Determine the chain's x-span `[x1, x2]`
2. Query the interval structure for the **maximum occupied bottom-Y** across the full span
3. Place the chain at `max_bottom_y + gap`
4. Update the interval structure with the chain's new x-span and bottom-Y

**Row height** = `max(node heights in row)`. **Gap** = 30px uniformly — same between rows as between nodes within a chain.

---

## X-Position Rules

### Cross-Row Edge Alignment

Only the **first node** in each downstream chain gets x-aligned to its upstream split. Deeper connections within the same chain (edges skipping internal nodes to reach the end boundary) are accepted as-is and may produce longer diagonal edges.

**Example:** If A connects to both D (first internal) and F (end boundary) in chain `[A, D, E, F]`:
- D is already x-constrained (sequential right after A) — no adjustment needed
- F's position is determined by E and the merge rule, not by the A→F edge

### Placement Rules

Every node's x-position is determined by exactly one rule. The rules form a priority hierarchy — the first matching rule wins:

| Priority | Role | Rule |
|----------|------|------|
| 1 | **Primary root** | Anchored to current user position — not moved |
| 2 | Merge / merge-split | `x = max(parent.right for all parents) + gap` |
| 3 | Last internal before a **merge** end boundary **in a lower row** | `x = max(prev.right + gap, end.x - width - gap)` |
| 4 | Split or secondary root with an **independent** downstream merge | `x = merge.x_fwd - min_direct_path_width` — or `x = max(prev.right + gap, merge.x_fwd - min_direct_path_width)` if a prev exists |
| 5 | All other nodes | `x = prev.right + gap` (sequential) |

**Rule 3:** If the end boundary is not a merge, is in the same row, or is in a higher row, the condition is not met and the node falls through to rule 5. No special-casing needed.

**Rule 4:**

- `min_direct_path_width` = `this.width + sum(internal.widths) + (n+1) × gap`, where n = number of internals on the direct chain between this node and the target merge. Does not cross chain boundaries.
- **Independence:** merge M is independent of split S if S is not the dominant input to M — i.e., increasing S.right would not increase M.x_fwd. To verify, compute M.x without S's contribution by traversing alternative paths to M, **explicitly skipping S** to avoid cycles. (Example: if S→E→M and S→M directly, skip S when evaluating E's contribution to M.)
- **Target merge selection:** among all independent downstream merges, pick the one that results in the **largest x for the split** (most constraining). Prefer same-row merges among equally-constraining candidates.
- **Secondary roots** (no prev): the pull alone determines x and can be negative — no `max(prev.right + gap, …)` guard.

Rule 4 unifies split-pull and secondary-root placement: both place a chain start so its direct path fits exactly between itself and a downstream merge.

Adding an edge can **promote** a node from simple → merge, making it a new chain boundary and splitting the chain it previously belonged to.

---

## Root Anchoring

The **primary root** (the root with the smallest current y) is anchored to its current user position — x and y are not recomputed. All other nodes are placed relative to it.

**Secondary roots** follow rule 4 and can land at negative x if needed to fit their chain before a shared downstream merge.

---

## Islands

An **island** is a connected subgraph with no edges to any other subgraph. Each island is laid out independently using the same algorithm.

Inter-island collision resolution — shifting lower islands downward to avoid overlap with higher islands — is deferred to a later version.

---

## Open Questions

1. **Convergence** — Rule 4 positions a split based on a downstream merge's x, which is itself computed during the same DFS pass. In most topologies a single pass suffices, but deeply nested fan-in/fan-out structures may cause a split's pull to invalidate a merge position computed earlier in the traversal. Open question: does a single DFS always converge, or is fixed-point iteration needed in the worst case?

2. **Audio graph cycles** — The algorithm assumes a DAG. The Web Audio API permits cycles (e.g., a delay node in a feedback loop). Deferred for now.

3. **Inter-island collision resolution** — Deferred. See *Islands* section.
