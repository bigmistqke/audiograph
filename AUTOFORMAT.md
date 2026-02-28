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
Walk nodes in reverse topological order. For each node, evaluate the placement rules (see *Placement Rules* below) and apply whichever rule matches. Because rules have conditions baked in, no edge cases need separate treatment — a node that doesn't satisfy rule 3's or 4's conditions simply falls through to rule 5 (sequential).

After a split is pulled (rule 4), any merges that take it as input may need their positions updated (rule 2). This propagation may require more than two passes in some topologies. See Open Questions.

### Phase 3: Y Pass
Process rows top-to-bottom. For each chain:
1. Determine the chain's x-range `[x1, x2]`
2. Query the **maximum occupied bottom-Y** across the entire chain x-span (not just the leftmost node's column — the whole span)
3. Place the chain at `max_bottom_y + gap`

Row height = `max(node heights in row)`.

The Y pass requires a spatial data structure that tracks occupied y-space per x-range (an interval query). The gap constant (30px) is uniform — same between rows as between nodes within a chain.

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
- **Target merge selection**: among all independent downstream merges, prefer **same-row** merges (largest pull among same-row candidates); fall back to largest pull among cross-row candidates if none are same-row.
- **Secondary roots** (no prev): rule 4 applies without the `max(prev.right + gap, …)` guard — the pull alone determines x, and it can be negative.

Rule 4 unifies the split pull and the secondary-root placement: both are expressions of the same operation — place a chain start so its chain fits exactly between itself and a fixed downstream merge.

Adding an edge can **promote** a node from simple → merge, which changes its rule and makes it a new chain boundary, splitting the chain it previously belonged to.

---

## Root Anchoring

The **primary root** (topmost root — smallest y in current layout) is **anchored to its current user position**. Its x and y are not recomputed; all other nodes are placed relative to it.

**Secondary roots** (other roots in a multi-root graph) are placed by the backward pass like any other chain start — they follow rule 4 and can end up at negative x if needed to fit their chain before a shared downstream merge.

## Islands

An **island** is a group of nodes with no edges connecting it to any other group. A graph can contain multiple islands.

Each island is laid out independently. Islands are then arranged to avoid collisions:
- Each island's root stays anchored to its current position where possible.
- If a lower island's computed layout would overlap a higher island, the lower island's root is shifted downward until there is no collision.
- Horizontal positions of island roots are preserved — only vertical shifting is used to resolve inter-island collisions.

*This is deferred to a later version of the algorithm. For now, islands are laid out independently without collision resolution.*

---

## Open Questions

1. **Pass count / convergence** — The rule hierarchy is correct, but execution order matters. Pulling a split (rule 4) can update its position, which may invalidate a downstream merge (rule 2), which may in turn affect another split, etc. The "two forward/backward passes" framing of CPM may not capture all propagation chains. Open question: what execution order minimises passes, and is a fixed-point iteration needed in the worst case?

2. **Chicken-and-egg: row assignment vs x-positions** — Row assignment uses minimum widths to detect x-range overlap, but actual x-positions (after pulls) may be wider. Do we need to re-assign rows after the X pass? If row assignment changes, pull eligibility (same-row vs cross-row) also changes, making this circular.

3. ~~**Boundary nodes in multiple chains**~~ — **Resolved**: row assignment is per-chain, not per-node. A boundary node starting multiple chains may have those chains land in different rows. The node's x is its single computed position; it has no "home row."

4. **Multiple roots / Islands** — Fully disconnected subgraphs (islands) are laid out independently. Inter-island collision resolution (shifting lower islands downward) is deferred. See *Islands* section.

5. ~~**Reconcile memoized recursion with CPM**~~ — **Resolved**: the memoized recursion framing is superseded by the CPM forward/backward pass description. Remove any remaining references to it.

6. ~~**Forward pass topological order**~~ — **Resolved**: standard Kahn's algorithm (BFS-based topological sort). All roots are initial nodes and are processed simultaneously.

7. ~~**Y pass details**~~ — **Resolved**: row height = `max(node heights in row)`. Gap = 30px uniformly. Chain y = max occupied bottom-Y across the full chain x-span + gap (not just the leftmost node's column — the widest node in the chain can push the whole chain down).

8. ~~**Cross-row edge alignment in CPM**~~ — **Resolved**: falls out of the rule conditions. Rule 3 requires the end boundary to be in a lower row; rule 4 requires the target merge's x to be independent of the split. Neither rule has a same-row exclusion baked in for splits — a split is pulled toward a same-row merge whenever the merge's x is stable. Only the first node in each downstream chain gets x-aligned; deeper connections accept longer diagonals.

9. ~~**Root x-position**~~ — **Resolved**: roots are anchored to their current user position. See *Root Anchoring* section.

10. ~~**Zero-internal-node chains**~~ — **Resolved**: zero-internal chains `[A, B]` are valid. They participate in row assignment with x-range `[start.x, end.right]`. End boundary x comes from forward pass (merge rule); start boundary x comes from backward pass (split pull rule).

11. ~~**End boundary is a split**~~ — **Resolved**: falls out of rule 3's condition ("last internal before a **merge** end boundary, **in a lower row**"). Same-row, upward, and non-merge end boundaries all simply fail to match rule 3 and fall through to rule 5 (sequential). No special cases needed.

12. ~~**Definition of "longest child path"**~~ — **Resolved**: the reference point for rule 4 is the **target merge's forward-pass x** directly — no need to find the "last node of an alternative path." The formula is `x = merge.x_fwd - min_direct_path_width`. The merge's x_fwd is already computed in the forward pass; no additional traversal is needed beyond identifying which merge to target (see target merge selection in rule 4).

13. ~~**Row height**~~ — **Resolved**: `max(node heights in row)`.

14. ~~**Chain priority from user position**~~ — **Resolved**: the chain's start boundary node's current y-coordinate determines priority. Lower y = higher priority = assigned to an earlier row.

15. **Audio graph cycles** — The algorithm assumes a DAG. The Web Audio API does support cycles (a delay node is required to avoid infinite feedback), so this is a real concern. Deferred for now.

16. ~~**`minChildPathWidth` across chain boundaries**~~ — **Resolved**: see Q12 and rule 4. `min_direct_path_width` is the width of this node + all internals on the direct chain to the merge + gaps between them. It does not cross chain boundaries — it is the width of the direct path only. The target merge is selected using its forward-pass x (already computed); no cross-boundary traversal is needed.
