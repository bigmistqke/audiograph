# Autoformat Algorithm Spec

## Thesis

This algorithm is **prettier for audio graphs**.

Prettier takes messy code and reformats it into a clean, consistent structure — but it isn't purely mechanical. It respects some of your intent: if you put arguments on separate lines, prettier keeps them on separate lines. It's opinionated about *structure*, deferential about *ordering*.

This algorithm does the same thing for graphs:
- **Opinionated about structure**: nodes snap to a clean grid, x-positions follow strict alignment rules (CPM-based), y-positions are computed from a spatial interval structure.
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

A chain runs from one boundary node to the next. Every simple node belongs to exactly one chain. Boundary nodes can appear as the endpoint of multiple chains (as start of one, end of another).

**Examples:**
- `[A, D, E, C]` — A (split) → D (simple) → E (simple) → C (merge)
- `[A, B]` — A (split) → B (split), no internal nodes
- `[B]` — a merge-split as a single-node chain

**Zero-internal chains** like `[A, B]` are valid — two boundary nodes directly connected with no internals between them. They participate in row assignment with x-range `[start.x, end.right]`.

### Row
A **row** is a set of chains that share the same top-Y coordinate.

Two chains cannot share a row if their x-ranges overlap — they form separate rows instead.

Row ordering is determined by the **user's current y-positions of the branch-start nodes** at each split — lower y = earlier row. This is the mechanism by which user intent is preserved: the relative vertical ordering of branches is respected, not recomputed from topology.

Row assignment is per-chain, not per-node. A boundary node that starts multiple chains is not "in" a single row; each chain it starts may land in a different row.

---

## Algorithm

### Step 1: Topology Analysis

Identify boundary nodes (split / merge / merge-split / root / leaf), then trace all chains between them. Compute each chain's **minimum width**: `sum(node widths) + (n-1) × gap`.

### Step 2: DFS Traversal — X-positions + Row Assignment

Row assignment and x-computation happen in a **single DFS traversal**. They are not separate phases. This is the key step.

**At each split node**, sort its outgoing branches by the **current y-position of each branch's first node** (ascending). Traverse branches in that order:

- The branch with the **lowest initial y** continues in the **current row** (spine continuation).
- Each subsequent branch **opens a new row** below — unless its first node is already row-assigned (claimed by a prior branch in the traversal). Already-claimed nodes represent cross-row edges; no new row is opened for them.

Row-claiming is **first-come-first-served in y-order** across the whole DFS. A node gets the row of whichever branch reaches it first (always the branch whose start had the lowest initial y, since that branch is traversed first).

**X-position** at each node is determined by the placement rules below. The key principle: at a **merge**, take the max of all parent right-edges (critical path). At a **split**, position to align with the most constraining independent downstream merge (the one that, if the split were placed just in time for its chain to fit, would push the split furthest right).

### Step 3: Build Spatial Data Structure

After x-positions are computed, build an **interval structure** indexed by x-range that tracks the maximum occupied bottom-Y for any x-span. Supports range queries: given an x-interval `[x1, x2]`, return the maximum bottom-Y across that span.

### Step 4: Y Pass

Process rows top-to-bottom. For each chain:
1. Determine the chain's x-span `[x1, x2]`
2. Query the interval structure for the **maximum occupied bottom-Y** across the full span
3. Place the chain at `max_bottom_y + gap`
4. Update the interval structure with the chain's new x-span and bottom-Y

Row height = `max(node heights in row)`. Gap = 30px uniformly — same between rows as between nodes within a chain.

---

## X-Position Rules

### Cross-Row Edge Alignment

When a node has edges going into a chain at **multiple depths** (e.g., edges to both an internal node and the end boundary), only the **first** node in the chain it connects to is x-aligned. Deeper connections are accepted as-is and may result in longer diagonal edges.

**Example:** If A (split) connects to both D (first internal) and F (end boundary) in chain `[A, D, E, F]`:
- D is already x-constrained (sequential right after A) — no pulling needed
- F's position is not adjusted based on the A→F edge — it is determined by E (last internal node) and the merge rule

### Placement Rules (by node role)

Every node's x-position is determined by exactly one rule. The rules form a hierarchy — when a node qualifies for multiple roles, the first matching rule wins:

| Priority | Role | Rule |
|----------|------|------|
| 1 | **Primary root** | Anchored to current user position — not moved |
| 2 | Merge / merge-split | `x = max(parent.right for all parents) + gap` |
| 3 | Last internal before a **merge** end boundary, **in a lower row** | `x = max(prev.right + gap, end.x - width - gap)` |
| 4 | Split or secondary root with an **independent** downstream merge | `x = merge.x_fwd - min_direct_path_width` — or `x = max(prev.right + gap, merge.x_fwd - min_direct_path_width)` if a prev exists |
| 5 | All other nodes | `x = prev.right + gap` (sequential) |

**Rule 3 conditions** do the work of all the "edge cases": if the end boundary is a split (not a merge), same-row, or in a *higher* row, the condition simply isn't met and the node falls through to rule 5.

**Rule 4 details:**

- `min_direct_path_width` = the minimum horizontal space needed from this node's left edge to the target merge's left edge along the direct chain: `this.width + sum(internal.widths) + (n+1) × gap` where n = number of internals between this node and the merge.
- **Independence**: merge M is independent of node N if N is not the dominant input to M in the forward pass — i.e., increasing N.right would not increase M.x_fwd (some other parent already drives M further right).
- **Target merge selection**: among all independent downstream merges, pick the one that results in the **largest x for the split** (most constraining). Same-row merges are preferred among equally-constraining candidates.
- **Secondary roots** (no prev): rule 4 applies without the `max(prev.right + gap, …)` guard — the pull alone determines x, and it can be negative.

Rule 4 unifies the split pull and the secondary-root placement: both are expressions of the same operation — place a chain start so its chain fits exactly between itself and a fixed downstream merge.

Adding an edge can **promote** a node from simple → merge, which changes its rule and makes it a new chain boundary, splitting the chain it previously belonged to.

---

## Root Anchoring

The **primary root** (topmost root — smallest y in current layout) is **anchored to its current user position**. Its x and y are not recomputed; all other nodes are placed relative to it.

**Secondary roots** (other roots in a multi-root graph) are placed by the traversal like any other chain start — they follow rule 4 and can end up at negative x if needed to fit their chain before a shared downstream merge.

## Islands

An **island** is a group of nodes with no edges connecting it to any other group. A graph can contain multiple islands.

Each island is laid out independently. Islands are then arranged to avoid collisions:
- Each island's root stays anchored to its current position where possible.
- If a lower island's computed layout would overlap a higher island, the lower island's root is shifted downward until there is no collision.
- Horizontal positions of island roots are preserved — only vertical shifting is used to resolve inter-island collisions.

*This is deferred to a later version of the algorithm. For now, islands are laid out independently without collision resolution.*

---

## Open Questions

1. **Pass count / convergence** — Rule 4 (split pull) positions a split based on the x_fwd of a downstream merge. But x_fwd is itself computed from the forward pass, which doesn't yet know the split's final position. In most topologies a single DFS pass suffices, but deeply nested fan-in/fan-out structures may require iteration. Open question: does a single DFS always converge, or is fixed-point iteration needed in the worst case?

2. ~~**Chicken-and-egg: row assignment vs x-positions**~~ — **Resolved**: the DFS traversal uses the user's initial y-positions of branch-start nodes to determine row order — not computed x-ranges. Rows are assigned stably during the traversal before x-positions are finalised.

3. ~~**Boundary nodes in multiple chains**~~ — **Resolved**: row assignment is per-chain, not per-node. A boundary node starting multiple chains may have those chains land in different rows. The node's x is its single computed position; it has no "home row."

4. **Multiple roots / Islands** — Fully disconnected subgraphs (islands) are laid out independently. Inter-island collision resolution (shifting lower islands downward) is deferred. See *Islands* section.

5. ~~**Reconcile memoized recursion with CPM**~~ — **Resolved**: the memoized recursion framing is superseded by the DFS traversal description.

6. ~~**Forward pass topological order**~~ — **Resolved**: DFS from roots, branches sorted by initial y of first node.

7. ~~**Y pass details**~~ — **Resolved**: row height = `max(node heights in row)`. Gap = 30px uniformly. Chain y = max occupied bottom-Y across the full chain x-span + gap.

8. ~~**Cross-row edge alignment**~~ — **Resolved**: falls out of the rule conditions. Rule 3 requires the end boundary to be in a lower row; rule 4 targets the most constraining independent merge. Only the first node in each downstream chain gets x-aligned; deeper connections accept longer diagonals.

9. ~~**Root x-position**~~ — **Resolved**: primary root is anchored to its current user position. See *Root Anchoring* section.

10. ~~**Zero-internal-node chains**~~ — **Resolved**: zero-internal chains `[A, B]` are valid. They participate in row assignment with x-range `[start.x, end.right]`.

11. ~~**End boundary is a split**~~ — **Resolved**: falls out of rule 3's condition. Non-merge and same-row end boundaries simply fail to match and fall through to rule 5.

12. ~~**Definition of "longest child path"**~~ — **Resolved**: rule 4 targets the independent downstream merge that produces the **largest x for the split** (most constraining). Independence checking requires traversing alternative paths, skipping the split itself to avoid cycles.

13. ~~**Row height**~~ — **Resolved**: `max(node heights in row)`.

14. ~~**Chain priority from user position**~~ — **Resolved**: at each split, branches are sorted by the initial y of their first node. Lower y = traversed first = earlier row.

15. **Audio graph cycles** — The algorithm assumes a DAG. The Web Audio API does support cycles (a delay node is required to avoid infinite feedback), so this is a real concern. Deferred for now.

16. ~~**`minChildPathWidth` across chain boundaries**~~ — **Resolved**: `min_direct_path_width` is the width of this node + all internals on the direct chain to the merge + gaps, and does not cross chain boundaries. Independence checking requires traversal: to verify that merge M is truly independent of split S, compute M.x without S's contribution, traversing through intermediate merges while explicitly skipping S to avoid cycles.
