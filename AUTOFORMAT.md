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

**Starting point:** DFS begins from the **primary root** — the root node with the smallest y, with x as tiebreaker (most top-left). After the primary DFS completes, any remaining roots (secondary roots) are processed in top-left order (smallest y, then smallest x).

**At each split node**, sort its outgoing branches by the **current y-position of each branch's first node** (ascending). Traverse branches in that order — this is the **forward phase**:

- The branch with the **lowest initial y** continues in the **current row** (spine continuation).
- Each subsequent branch **opens a new row** below — unless its first node is already row-assigned (claimed by a prior branch in the traversal). Already-claimed nodes represent cross-row edges; no new row is opened for them.

Row-claiming is **first-come-first-served in y-order** across the whole DFS. A node gets the row of whichever branch reaches it first — always the branch whose start had the lowest initial y, since that branch is traversed first.

After all branches are fully explored, the split computes its **pull** in a **post-order phase** (see Rule 4).

**Merges are settled on first visit.** When a merge is first reached in the DFS, its x-position is computed from the parents already visited (same or higher-priority rows). If the merge is reached again later via a cross-row edge from a lower-priority row, it is not repositioned — that arrival produces a longer diagonal edge accepted as-is.

**X-position** at each node is determined by the placement rules (see *X-Position Rules*).

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
| 2 | Merge / merge-split | `x = max(parent.right for parents in same or higher-priority rows) + gap` |
| 3 | Last internal before a **merge** end boundary **in a higher-priority row** (smaller row index) | `x = max(prev.right + gap, end.x - width - gap)` |
| 4 | Split or secondary root with a reachable **independent** merge in the same or higher-priority row | `x = merge.x_excl - min_path_width` — or `x = max(prev.right + gap, merge.x_excl - min_path_width)` if a prev exists |
| 5 | All other nodes | `x = prev.right + gap` (sequential) |

**Rule 3:** "Higher-priority row" means smaller row index (closer to the top of the layout). If the end boundary is not a merge, is in the same row, or is in a lower-priority row (larger row index), the condition is not met and the node falls through to rule 5.

**Rule 4:**

- **Target merge:** Follow paths forward from S through any intermediate boundaries. Skip same-priority intermediate merges (same row as S) and continue through them. Stop at the **first merge M with a strictly smaller row index** (higher-priority row) encountered along the path. If multiple paths lead to different first higher-priority merges, pick the one that gives the **largest x for S** (most constraining). For splits and secondary roots whose branches stay in the same or lower-priority rows, the target may also be a same-row merge reached via a direct chain — same-row merges are valid targets when no higher-priority merge is reachable.
- `min_path_width` = `sum of widths of all nodes on the path from S to M (excluding M) + (number of those nodes) × gap`. This includes any intermediate boundary nodes (merges, splits) traversed along the path — not just simple internals.
- **Independence:** compute `merge.x_excl` — M's x-position excluding S's subtree entirely. For each of M's parents: if the parent is downstream of S, skip it; otherwise include its right-edge. `merge.x_excl = max(non-S-subtree parent right-edges) + gap`. M is independent of S if `merge.x_excl` is finite (M has at least one parent not downstream of S). Use `merge.x_excl` as the pull target — not M's full forward-pass x.
- **Independence guarantees convergence.** If M is independent of S, its dominant path comes from outside S's subtree — settled before S is positioned in the post-order phase. A single DFS pass always converges.
- **Secondary roots** (no prev): the pull alone determines x and can be negative — no `max(prev.right + gap, …)` guard.

Rule 4 unifies split-pull and secondary-root placement: both place a chain start so its full path fits exactly between itself and a downstream merge.

Adding an edge can **promote** a node from simple → merge, making it a new chain boundary and splitting the chain it previously belonged to.

---

## Root Anchoring

The **primary root** is the root node with the smallest y, with x as tiebreaker (most top-left). It is anchored to its current user position — x and y are not recomputed. All other nodes are placed relative to it.

**Secondary roots** follow rule 4 and can land at negative x if needed to fit their path before a shared downstream merge. They are processed after the primary DFS completes, in top-left order (smallest y, then smallest x).

---

## Islands

An **island** is a connected subgraph with no edges to any other subgraph. Each island is laid out independently using the same algorithm.

Inter-island collision resolution — shifting lower islands downward to avoid overlap with higher islands — is deferred to a later version.

---

## Open Questions

1. **Audio graph cycles** — The algorithm assumes a DAG. The Web Audio API permits cycles (e.g., a delay node in a feedback loop). Deferred for now.

2. **Inter-island collision resolution** — Deferred. See *Islands* section.
