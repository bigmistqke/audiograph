# Autoformat Algorithm Spec

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
A **row** is a sequence of chains that are **top-aligned** (share the same top-Y coordinate).

Two chains cannot share a row if their x-ranges overlap — they form separate rows instead.

Row ordering is determined by:
1. The **user's current node positions** (primary — preserves user intent): the chain's start boundary node's current y-coordinate. Lower y = higher priority = assigned to an earlier row.
2. **Topology** (tiebreaker when positions are equal)

Row assignment is per-chain, not per-node. A boundary node that starts multiple chains is not "in" a single row; each chain it starts may land in a different row.

---

## Algorithm Phases

### Phase 1: Analysis
Performed on the graph structure using current node positions. No positions are computed yet.

1. **Identify chains** — find all boundary nodes (split/merge/merge-split/root/leaf), then trace linear paths between them
2. **Compute minimal widths** — for each chain: `min_width = sum(node widths) + (n-1) * gap`
3. **Assign chains to rows** — sort chains by priority (user position → topology), assign each chain to the **highest existing row** where its x-range does not conflict with any chain already in that row. If no existing row fits, open a new row below. This cascades: prioritizing top-alignment means chains pack upward as tightly as possible.

   Row assignment uses **minimum widths** (from step 2) to determine x-ranges for overlap detection, since actual x-positions are not yet computed.

### Phase 2: X Pass

X-positions are resolved in two sub-passes, modelled after the **Critical Path Method (CPM)** used in project scheduling.

#### Forward pass (left → right)
Walk nodes in topological order (Kahn's algorithm; all roots start simultaneously). Place every node at its **minimum x** using only sequential and merge rules — no pulls yet:

```
merge / merge-split:  x = max(parent.right for all parents) + gap
all others:           x = prev.right + gap
```

After the forward pass, all merge positions reflect the minimum x determined by the longest sequential chain reaching them.

#### Backward pass (right → left)
Walk nodes in reverse topological order. Apply **pull rules**:

```
split node:                x = max(prev.right + gap, ref.x - split.width - gap)
last internal before end:  x = max(prev.right + gap, end.x - node.width - gap)
                           (only when end boundary is in a lower row — i.e. a forward diagonal)
```

**Split pull — which reference to use:**
A split is pulled toward a downstream merge when the merge's x-position is **fixed independently** of the split — i.e., the forward-pass position of that merge is determined by a chain that doesn't pass through the split.

The **reference point** for the pull is the **last node in the longest alternative path to that merge** — the final node (before the merge) on the longest path that does not go through the split. This is not necessarily the merge node itself.

- If the alternative path ends with an internal node `H`, then `ref.x = H.x` and `split.x = H.x - split.width - gap`
- If there is no internal node in the alternative path (the merge has only one non-split input), `ref.x = merge.x` and `split.x = merge.x - split.width - gap`

Merges whose forward-pass x depends on the split's own output are excluded (circular dependency). **Same-row merges are not excluded** — a split is still pulled toward same-row merges when their x is stable.

**Last-internal pull — when it applies:**
The last internal node before an end boundary is pulled **only when the end boundary is in a lower row** (creating a forward diagonal edge). Two exclusions:
- **Same-row end boundary**: node stays sequential, no pull. A horizontal edge needs no compression.
- **Upward end boundary** (end is in a higher row than the last internal): node stays sequential, no pull. The shorter path accepts the long diagonal as a trade-off of the top-alignment preference.

**CPM completeness caveat:** The two-pass guarantee (merge positions are stable after the forward pass) may not hold in all topologies. When a split is an input to a merge, pulling the split rightward can increase that merge's x, which may cascade to further merges downstream. This may require additional passes or iterative refinement. See Open Questions.

### Phase 3: Y Pass
Process rows top-to-bottom. For each chain:
1. Determine the chain's x-range `[x1, x2]`
2. Query the **maximum occupied bottom-Y** across the entire chain x-span (not just the leftmost node's column — the whole span)
3. Place the chain at `max_bottom_y + gap`

Row height = `max(node heights in row)`.

The Y pass requires a spatial data structure that tracks occupied y-space per x-range (an interval query). The gap constant (30px) is uniform — same between rows as between nodes within a chain.

---

## X-Position Rules

### Within a Chain `[start, D1, D2, ..., Dn, end]`

- **Start boundary**: x determined externally by its own dependencies
- **Internal nodes D1 … Dn-1**: sequential — `x = prev.x + prev.width + gap`
- **Last internal node Dn**: pulled toward the end boundary **only when the end boundary is in a lower row** (forward diagonal edge) —
  `x = max(prev.right + gap, end.x - Dn.width - gap)`
  If the end boundary is in the same row or a higher row, Dn stays sequential.
- **End boundary**: x determined externally by its own dependencies

The last internal node is the only one that gets pulled. All other internal nodes are strictly sequential from the start.

### Cross-Row Edge Alignment

When a node has edges going into a chain at **multiple depths** (e.g., edges to both an internal node and the end boundary), only the **first** node in the chain it connects to is x-aligned. Deeper connections are accepted as-is and may result in longer diagonal edges.

**Example:** If A (split) connects to both D (first internal) and F (end boundary) in chain `[A, D, E, F]`:
- D is already x-constrained (sequential right after A) — no pulling needed
- F's position is not adjusted based on the A→F edge — it is determined by E (last internal node) and the merge rule

### Placement Rules (by node role)

Every node's x-position is determined by exactly one rule. The rules form a hierarchy — when a node qualifies for multiple roles, the first matching rule wins:

| Priority | Role | Rule |
|----------|------|------|
| 1 | Root | Anchored to current user position — not moved |
| 2 | Merge / merge-split | `x = max(parent.right for all parents) + gap` |
| 3 | Last internal before a merge end boundary, in a lower row | `x = max(prev.right + gap, end.x - width - gap)` |
| 4 | Split with an independent downstream merge | `x = max(prev.right + gap, ref.x - width - gap)` — where `ref` is the last node of the longest alternative path to the target merge, found by traversing the graph and summing widths |
| 5 | All other nodes | `x = prev.right + gap` (sequential) |

Rules 3 and 4 are the "complex" cases — they require traversing paths and summing widths to compute the reference position. All other nodes just step sequentially from their predecessor.

Adding an edge can **promote** a node from simple → merge, which changes its rule and makes it a new chain boundary, splitting the chain it previously belonged to.

---

## Root Anchoring

Each root node is **anchored to its current user position** — the layout preserves where the user placed it. The root's x and y are not recomputed; all other nodes are placed relative to it.

Secondary roots (in multi-root graphs where roots share downstream nodes) are also anchored to their current position. The topmost root (smallest y) is the primary anchor; others participate in the same layout.

## Islands

An **island** is a group of nodes with no edges connecting it to any other group. A graph can contain multiple islands.

Each island is laid out independently. Islands are then arranged to avoid collisions:
- Each island's root stays anchored to its current position where possible.
- If a lower island's computed layout would overlap a higher island, the lower island's root is shifted downward until there is no collision.
- Horizontal positions of island roots are preserved — only vertical shifting is used to resolve inter-island collisions.

*This is deferred to a later version of the algorithm. For now, islands are laid out independently without collision resolution.*

---

## Open Questions

1. **CPM completeness** — The two-pass approach may be insufficient when a split is a direct input to a merge: pulling the split rightward increases that merge's x, which can cascade. Does the algorithm need additional passes or iterative refinement to converge?

2. **Chicken-and-egg: row assignment vs x-positions** — Row assignment uses minimum widths to detect x-range overlap, but actual x-positions (after pulls) may be wider. Do we need to re-assign rows after the X pass? If row assignment changes, pull eligibility (same-row vs cross-row) also changes, making this circular.

3. ~~**Boundary nodes in multiple chains**~~ — **Resolved**: row assignment is per-chain, not per-node. A boundary node starting multiple chains may have those chains land in different rows. The node's x is its single computed position; it has no "home row."

4. **Multiple roots / Islands** — Fully disconnected subgraphs (islands) are laid out independently. Inter-island collision resolution (shifting lower islands downward) is deferred. See *Islands* section.

5. ~~**Reconcile memoized recursion with CPM**~~ — **Resolved**: the memoized recursion framing is superseded by the CPM forward/backward pass description. Remove any remaining references to it.

6. ~~**Forward pass topological order**~~ — **Resolved**: standard Kahn's algorithm (BFS-based topological sort). All roots are initial nodes and are processed simultaneously.

7. ~~**Y pass details**~~ — **Resolved**: row height = `max(node heights in row)`. Gap = 30px uniformly. Chain y = max occupied bottom-Y across the full chain x-span + gap (not just the leftmost node's column — the widest node in the chain can push the whole chain down).

8. ~~**Cross-row edge alignment in CPM**~~ — **Resolved**: only the first node in each downstream chain gets x-aligned; deeper connections accept longer diagonals. Already in spec.

9. ~~**Root x-position**~~ — **Resolved**: roots are anchored to their current user position. See *Root Anchoring* section.

10. ~~**Zero-internal-node chains**~~ — **Resolved**: zero-internal chains `[A, B]` are valid. They participate in row assignment with x-range `[start.x, end.right]`. End boundary x comes from forward pass (merge rule); start boundary x comes from backward pass (split pull rule).

11. ~~**End boundary is a split**~~ — **Resolved**: when the end boundary of a chain is a split (not a merge), the last internal node stays sequential — no pull. The split's own x is determined by its role as the start boundary of its outgoing chains.

12. ~~**Definition of "longest child path"**~~ — **Reframed**: the split pull (rule 4) finds the **last independent reference node** — the final node before the target merge in the longest alternative path that does not pass through the split. Traverse the graph to enumerate alternative paths; sum node widths + gaps along each to find the longest in pixels; the last node on that path is `ref`. The split is placed so that `split.right + gap = ref.x`.

13. ~~**Row height**~~ — **Resolved**: `max(node heights in row)`.

14. ~~**Chain priority from user position**~~ — **Resolved**: the chain's start boundary node's current y-coordinate determines priority. Lower y = higher priority = assigned to an earlier row.

15. **Audio graph cycles** — The algorithm assumes a DAG. Deferred: the Web Audio API does not support true signal cycles, so this is not a concern in practice.

16. ~~**`minChildPathWidth` across chain boundaries**~~ — **Reframed**: see Q12. `minChildPathWidth` as a single accumulated scalar is not the right abstraction. The split pull traverses the graph to find alternative paths, sums widths + gaps along each to identify the longest, and uses the last node of that path as the reference. The "width sum" is implicit in that traversal — it selects the longest path, it is not fed into a separate formula.
