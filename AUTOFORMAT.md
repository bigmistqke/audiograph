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

### Row
A **row** is a sequence of chains that are **top-aligned** (share the same top-Y coordinate).

Two chains cannot share a row if their x-ranges overlap — they form separate rows instead.

Row ordering is determined by:
1. The **user's current node positions** (primary — preserves user intent)
2. **Topology** (tiebreaker when positions are equal)

---

## Algorithm Phases

### Phase 1: Analysis
Performed on the graph structure using current node positions. No positions are computed yet.

1. **Identify chains** — find all boundary nodes (split/merge/merge-split/root/leaf), then trace linear paths between them
2. **Compute minimal widths** — for each chain: `min_width = sum(node widths) + (n-1) * gap`
3. **Identify x-variable chains and pull candidates** — walk chains to find:
   - Chains whose end boundary is a merge/merge-split (their last internal node can be pulled)
   - Split nodes whose longest child path ends at a known merge (the split can be pulled rightward)
   - These form the dependency graph: edges represent "node A's x must be resolved before node B's x"
4. **Assign chains to rows** — sort chains by priority (user position → topology), assign each chain to the **highest existing row** where its x-range does not conflict with any chain already in that row. If no existing row fits, open a new row below. This cascades: prioritizing top-alignment means chains pack upward as tightly as possible.

### Phase 2: X Pass

X-positions are resolved in two sub-passes, modelled after the **Critical Path Method (CPM)** used in project scheduling. This dissolves circular dependencies (e.g. a split whose longest child path ends at a merge that also depends on the split) without requiring cycle detection or multiple iterations.

#### Forward pass (left → right)
Walk nodes in topological order. Place every node at its **minimum x** using only sequential and merge rules — no pulls yet:

```
merge / merge-split:  x = max(parent.right for all parents) + gap
all others:           x = prev.right + gap
```

After the forward pass, all merge positions are fixed at their minimum possible x (determined by the longest sequential chain reaching them).

#### Backward pass (right → left)
Walk nodes in reverse topological order. Apply **pull rules** toward already-fixed merge positions:

```
split node:                x = max(prev.right + gap, merge.x - minChildPathWidth - gap)
last internal before end:  x = max(prev.right + gap, end.x - node.width - gap)
```

**Key guarantee:** pulled nodes end up with `node.right = merge.x - gap`, which does not increase the merge's position (it was already set to `max(...) + gap` in the forward pass). Therefore merge positions remain stable — exactly two passes suffice, no iteration needed.

**Minimal widths** (pre-computed in Phase 1) are used in the backward pass so that split nodes can determine how much space their longest child path requires without re-resolving variable nodes.

### Phase 3: Y Pass
Process rows top-to-bottom. For each chain:
1. Determine the chain's x-range `[x1, x2]`
2. Query the maximum occupied bottom-Y in that x-range (from already-placed rows)
3. Place the chain at `max_bottom_y + gap`

This requires a spatial data structure that tracks occupied y-space per x-range (an interval query).

---

## X-Position Rules

### Within a Chain `[start, D1, D2, ..., Dn, end]`

- **Start boundary**: x determined externally by its own dependencies
- **Internal nodes D1 … Dn-1**: sequential — `x = prev.x + prev.width + gap`
- **Last internal node Dn**: pulled toward the end boundary **only when they are in different rows** (i.e. the edge would be diagonal) —
  `x = max(prev.right + gap, end.x - Dn.width - gap)`
  If the end boundary shares the same row, Dn stays sequential.
- **End boundary**: x determined externally by its own dependencies

The last internal node is the only one that gets pulled. All other internal nodes are strictly sequential from the start.

### Cross-Row Edge Alignment

When a node has edges going into a chain at **multiple depths** (e.g., edges to both an internal node and the end boundary), only the **first** node in the chain it connects to is x-aligned. Deeper connections are accepted as-is and may result in longer diagonal edges.

**Example:** If A (split) connects to both D (first internal) and F (end boundary) in chain `[A, D, E, F]`:
- D is already x-constrained (sequential right after A) — no pulling needed
- F's position is not adjusted based on the A→F edge — it is determined by E (last internal node) and the merge rule

### Node X-Constraints (by type)

A node's x-constraint is determined entirely by its type:

| Node type | Constraint |
|-----------|------------|
| Merge / merge-split | `x = max(parent.right for all parents) + gap` |
| Last internal node before end boundary | `x = max(prev.right + gap, end.x - width - gap)` |
| Other internal node | `x = prev.right + gap` |
| Split / simple (within chain) | `x = prev.right + gap` |
| Root | fixed starting position |

Adding an edge can **promote** a node from simple → merge, which changes its constraint and makes it a new chain boundary, splitting the chain it previously belonged to.


---

## Multiple Roots

When the graph has multiple roots, pick one as the starting point based on a heuristic. For now: **topmost root** (smallest y in current layout). This may change.

## Open Questions

1.  **CPM completeness** — Does the two-pass CPM approach hold for all graph configurations, or are there edge cases that require iteration?

2. **Chicken-and-egg: row assignment vs x-positions** — Row assignment in Phase 1 uses x-ranges to detect overlap, but x-positions aren't computed until Phase 2. Do we use minimal widths for row assignment? If so, do we need to re-assign rows after the actual X pass produces different (wider) positions?

3. **Boundary nodes in multiple chains** — Nodes like a root split appear as the start of many chains. They have one x-position but are endpoints of multiple chains. How does this interact with row assignment — does the node "belong" to one row, and if so which one?

4. **Multiple roots** — The topmost root is chosen as the starting point, but what happens to other roots? Do they start independent sub-layouts, and if so how are those merged into the overall layout?

5. **Reconcile memoized recursion with CPM** — The earlier pseudocode describes lazy memoized recursion; the X pass now describes CPM forward/backward passes. These need to be reconciled into a single coherent description.

6. **Forward pass topological order** — How exactly do we walk nodes in topological order when the graph has multiple roots and complex merge/split patterns?

7. **Y pass details** — Node heights, row heights (max node height in row?), gap between rows vs gap between nodes in a chain, exact semantics of the interval query.

8.  **Cross-row edge alignment in CPM** — The "only align the first node in the chain it connects to" rule needs to be explicitly integrated into the forward/backward pass description.

9.  **Root x-position** — Where does the root node start? x=0, or its current user position? This anchors the entire layout.

10. **Zero-internal-node chains** — Chains that are just two boundary nodes directly connected (e.g. `[A, B]` with no internal nodes). How are these handled in row assignment and x-positioning? Do they even occupy a row?

11. **End boundary is a split** — We mostly assumed end boundaries are merge nodes. What determines a split's x-position when it is the end boundary of a chain?

12. **Definition of "longest child path"** — For split nodes, is "longest" measured by node count or min-width sum? Does it only follow the first child in each downstream chain (per the cross-row alignment rule)?

13. **Row height** — Is a row's height `max(node heights in row)`? How does variable node height interact with the Y pass interval query?

14. **Chain priority from user position** — Which positional property determines chain priority for row assignment — top-left corner, center, something else?

15. **Audio graph cycles** — The algorithm assumes a DAG. What happens if the audio graph contains a cycle?

16. **`minChildPathWidth` across chain boundaries** — For a split whose longest child path spans multiple chains (passing through intermediate boundary nodes), how is `minChildPathWidth` accumulated across those boundaries?
