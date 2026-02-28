# Autoformat Algorithm Spec

## Thesis

This algorithm is **prettier for audio graphs**.

Prettier takes messy code and reformats it into a clean, consistent structure — but it isn't purely mechanical. It respects some of your intent: if you put arguments on separate lines, prettier keeps them on separate lines. It's opinionated about *structure*, deferential about *ordering*.

This algorithm does the same thing for graphs:
- **Opinionated about structure**: nodes snap to a clean grid, x-positions follow strict alignment rules, y-positions are computed from a spatial interval structure.
- **Deferential about ordering**: the user's current y-positions of branch-start nodes determine which row each branch lands in. If you put one branch below another, the algorithm keeps it there.

The result is a layout that is always tidy, but still feels like *yours*.

The algorithm is **not** a single DFS traversal — it requires four sequential phases over a topological sort. The reason is a fundamental causal conflict: Rules 2 and 5 are *forward causal* ("given my parents' positions, place me"), while Rule 4 is *backward causal* ("look downstream at a merge's final position, then pull myself upstream to fit"). A single forward pass cannot satisfy both directions simultaneously. See *Why Four Phases* for details.

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

A **row** is a set of chains that share the same top-Y coordinate. Chains in the same row may share boundary nodes (a merge node can be the end of one chain and the start of another in the same row), but their interiors never overlap.

Row ordering is determined by the **user's current y-positions of branch-start nodes** at each split: lower y = earlier row. This is the mechanism by which user intent is preserved — the relative vertical ordering of branches is respected, not recomputed from topology.

Row assignment is per-chain, not per-node. A boundary node that starts multiple chains has no single "home row"; each chain it starts may land in a different row.

---

## Graph Preprocessing

Before topology analysis, the raw graph edges are normalized:

**Edge deduplication:** All edges between the same pair of nodes are collapsed into a single logical parent/child relationship. Sub-port distinctions (which specific input/output port was used) are ignored — the algorithm only considers whether a connection exists between two nodes, not how many times or via which ports.

This is a current design decision: the algorithm treats nodes as having a single logical input and output for the purpose of layout. Multi-port graphs where the same two nodes are connected via different port combinations are handled correctly as long as the layout only needs to know *that* a connection exists.

---

## Algorithm

### Step 1: Topology Analysis

Identify all boundary nodes (split / merge / merge-split / root / leaf) and trace all chains between them.

### Step 2: Row Assignment + X-Positions

X-computation happens in **four sequential phases**. All phases use topological order (Kahn's algorithm) to guarantee parents are processed before children.

**Starting point:** The **primary root** — the root node with the smallest y, with x as tiebreaker (most top-left) — is anchored to its current position. Secondary roots are processed after the primary root's subtree is fully placed, in top-left order (smallest y, then smallest x).

#### Step 2a: Row Assignment

Process boundary nodes in topological order. At each node, sort its outgoing branches by the **current y-position of each branch's first node** (ascending):

- The branch with the **lowest initial y** continues in the **current row** (spine continuation).
- Each subsequent branch **opens a new row** below. If the end boundary is already row-assigned, the interior nodes of the chain still open their own row — only the end boundary keeps its existing row assignment.

Row-claiming is **first-come-first-served in y-order** across the whole traversal, with one exception: **merge and merge-split end boundaries prefer the highest-priority (lowest-index) row**. If a later chain reaches a merge that was previously assigned to a lower-priority row, the merge is updated to the higher-priority row.

#### Step 2b: Forward Pass

Walk all nodes in topological order, assigning **provisional** x-positions using Rules 1, 2, and 5. Rule 4 pulls are not applied yet — splits and secondary roots receive their Rule 5 provisional position here.

Merges get a provisional Rule 2 position based on whichever parents have been processed so far in topological order. These positions are not final — merges are recomputed in Step 2d after all Rule 4 pulls are known.

#### Step 2c: Rule 4 Pulls

Process splits in reverse topological order (post-order approximation), then secondary roots in y-order. For each, compute the best pull (see Rule 4), update x, and propagate the new position forward through any sequential (simple/leaf) nodes in the split's chains.

Rule 4 reads from the current x-map to evaluate `x_excl` on target merges — this is why the forward pass (2b) must run first, even though the merge positions it produces are provisional.

When no Rule 4 target is reachable, splits stay at their Rule 5 position. Secondary roots with no reachable target default to x = 0.

#### Step 2d: Reconcile Pass

After all Rule 4 pulls, recompute all non-fixed nodes in topological order using their final rules. Fixed nodes (primary root, splits, secondary roots — all placed in earlier phases) are kept as-is. For all others:

- **Rule 3** nodes: computed for the first time here, using `x_excl` to break circular dependencies (see Rule 3)
- **Rule 2** nodes: recomputed from all parents' now-finalized positions
- **Rule 5** nodes: recomputed sequentially from their single parent

This is the pass where merge positions become final. Each merge is computed exactly twice: a provisional position in 2b (so Rule 4 has something to evaluate), and a final position in 2d (after all splits have pulled).

### Step 3: Build Spatial Data Structure

After x-positions are finalized (Steps 2a–2d), build an **interval structure** indexed by x-range that tracks the maximum occupied bottom-Y for any x-span. Supports range queries: given `[x1, x2]`, return the maximum bottom-Y across that span.

### Step 4: Y Pass

Rows are the unit of y-placement — all nodes in a row share the same y-coordinate. Rows are processed in the order they are first encountered by the same DFS traversal as Step 2a (children visited in ascending initial-y order, each subtree fully exhausted before the next sibling). This is critical: it ensures that by the time a row is placed, all rows whose x-ranges might block it have already been inserted into the interval structure.

**Do not process rows in row-index order.** A row with a low index may need to be placed *after* a row with a higher index if the higher-index row's subtree occupies an x-range that overlaps with the low-index row. The DFS traversal handles this automatically — branches that come later in the y-sorted sibling order are always processed after the earlier siblings' full subtrees.

For each row in DFS order:
1. Collect all chains in the row. Determine the row's **full x-span** — the union of all nodes' x-ranges across every chain in the row.
2. Query the interval structure for the **maximum occupied bottom-Y** across the full x-span.
3. Place all nodes in the row at `y = max_bottom_y + gap`.
4. Update the interval structure with one entry **per node**: `{ xStart: node.x, xEnd: node.x + node.width, bottomY: y + node.height }`.

Using per-node intervals (rather than one interval spanning the full row) allows nodes in non-overlapping x-columns to avoid being blocked by the tallest node elsewhere in the row. The query in step 2 still uses the full row x-span to ensure correct placement, but the updates record each node's actual footprint individually.

**Row height** = `max(node heights across all chains in the row)`. **Gap** = 30px uniformly — same between rows as between nodes within a chain.

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
| 2 | Merge / merge-split | `x = max(parent.right for ALL parents) + gap` |
| 3 | Last internal of a chain whose end boundary is a merge in a **strictly higher-priority row** (smaller row index) than the chain's start | `x = max(prev.right + gap, end.x_excl - width - gap)` |
| 4 | Split or secondary root with a reachable **independent** merge in the same or higher-priority row | `x = merge.x_excl - min_path_width` — or `x = max(prev.right + gap, merge.x_excl - min_path_width)` if a prev exists |
| 5 | All other nodes | `x = prev.right + gap` (sequential) |

**Rule 2:** All parents are considered regardless of row. Because merges are recomputed in the reconcile pass (Step 2d), they always reflect the final positions of every parent.

**Rule 3:** Applies to the last internal node of a chain `[start, ..., lastInternal, endMerge]` where `endMerge` is in a strictly higher-priority row (smaller row index) than `start`. If the end boundary is not a merge, is in the same row, or is in a lower-priority row, the node falls through to Rule 5.

Rule 3 is applied only during the reconcile pass (Step 2d). It uses `end.x_excl` — the end merge's position excluding `start`'s subtree — rather than `end.x` directly. This breaks a circular dependency: the end merge's Rule 2 position includes `lastInternal` as a parent, so reading `end.x` would be self-referential. `end.x_excl` is computed as the max right-edge of the merge's parents that are **not** downstream of `start`, plus gap.

**Rule 4:**

- **Target merge:** Follow paths forward from S through any intermediate boundaries. Track `visitedBoundaries` to avoid revisiting the same boundary twice (handles DAG diamonds and same-row merges). Skip same-row intermediate merges (continue through them). Stop at the **first merge M with a strictly smaller row index** (higher-priority row) along the path. If multiple paths reach different first higher-priority merges, pick the one that gives the **largest x for S** (most constraining). If no higher-priority merge is reachable, a same-row merge is a valid fallback target.
- `min_path_width` = `sum of widths of all nodes on the path from S to M (excluding M) + (number of those nodes) × gap`. Includes any intermediate boundary nodes traversed — not just simple internals.
- **Independence:** compute `merge.x_excl` — M's x-position excluding S's subtree entirely. For each of M's parents: if the parent is downstream of S, skip it; otherwise include its right-edge. `merge.x_excl = max(non-S-subtree parent right-edges) + gap`. M is independent of S if `merge.x_excl` is finite (M has at least one parent not downstream of S). Use `merge.x_excl` as the pull target — not M's full x.
- **Independence guarantees convergence.** If M is independent of S, its dominant position comes from outside S's subtree — finalized before S is evaluated in the post-order phase.
- **Secondary roots** (no prev): the pull alone determines x and can be negative — no `max(prev.right + gap, …)` guard. If no Rule 4 target is reachable, secondary roots default to x = 0.

Rule 4 unifies split-pull and secondary-root placement: both place a chain start so its full path fits exactly between itself and a downstream merge.

Adding an edge can **promote** a node from simple → merge, making it a new chain boundary and splitting the chain it previously belonged to.

---

## Why Four Phases

The algorithm cannot be reduced to a single traversal because **Rule 4 operates in the opposite causal direction from Rules 2 and 5**:

- **Rules 2 and 5** are *forward causal*: "given my parents' positions, compute mine."
- **Rule 4** is *backward causal*: "look downstream at a merge's final position, then pull myself upstream to fit."

A single forward pass can satisfy one direction but not both. The four phases each resolve a specific dependency:

**Why the forward pass (2b) must come before Rule 4 pulls (2c):**
Rule 4 calls `x_excl` on target merges, which reads their parents' current x-positions. Those positions must exist before Rule 4 can evaluate them — a forward pass is required to populate the x-map even if the results are provisional.

**Why Rule 4 runs in reverse topological order:**
Deeper splits must pull before shallower ones. If a shallow split pulls first, its downstream chains shift — invalidating the `x_excl` values that deeper splits would read. Processing in post-order ensures each split's pull propagates correctly without corrupting the inputs of splits higher in the graph.

**Why the reconcile pass (2d) is necessary:**
After Rule 4 pulls, the nodes that moved are splits and sequential chains. But merges (Rule 2) haven't been updated to reflect their parents' new positions, and Rule 3 nodes haven't been computed at all. The reconcile pass fixes both:
- Rule 2 merges are recomputed with finalized parent positions.
- Rule 3 nodes can now safely read `end.x_excl` — the end merge's Rule 2 position is final, and using `x_excl` rather than `end.x` avoids the self-referential dependency (the last internal is itself one of the merge's parents).

**Summary:** Forward pass → backward pulls → forward reconcile. Each direction resolves what the other direction leaves unresolved.

---

## Root Anchoring

The **primary root** is the root node with the smallest y, with x as tiebreaker (most top-left). It is anchored to its current user position — x and y are not recomputed. All other nodes are placed relative to it.

**Secondary roots** follow Rule 4 and can land at negative x if needed to fit their path before a shared downstream merge. They are processed after all splits have been pulled (Step 2c), in top-left order (smallest y, then smallest x).

---

## Islands

An **island** is a connected subgraph with no edges to any other subgraph. Each island is laid out independently using the same algorithm.

Inter-island collision resolution — shifting lower islands downward to avoid overlap with higher islands — is deferred to a later version.

---

## Optimizations

### 1. Descendant cache threading

`descCache` was previously created fresh on every `computeXExcl()` call, recomputing the same ancestor relationships O(N·M) times. One cache is now created per `applyRule4()` / `reconcilePass()` call and threaded through.

### 2. Precomputed chains

`traceChain()` previously re-walked the same node paths in `assignRows()`, `findBestRule4Pull()`, and `computeRule3Map()`. `buildChainMap()` now traces all chains once immediately after topology and stores them in a `Map<startId, Map<firstChildId, string[]>>` lookup used by all passes.

### 3. Sorted interval structure with early-exit queries

`queryMaxBottomY()` previously did a full O(n) linear scan for every row placement. The interval array is now kept sorted by `xStart` (insertion sort on insert), and the query loop breaks early when `iv.xStart >= xEnd`.

### 4. Precomputed ancestor sets

`isDescendantOf()` previously recursed per-call, rewalking overlapping ancestor paths with a memoization cache. `buildAncestorSets()` now computes full ancestor sets for all nodes in one O(n) topological pass. All descendant checks use `Set.has()` lookups. `isDescendantOf` has been removed.

### 5. Hoisted info/width lookups in hot loops

`infos.get(pid)!.width` was called repeatedly inside `map()`/spread-max patterns in the forward pass and reconcile pass. Rule 2 and Rule 5 paths now use explicit `for` loops with the `infos.get()` result cached once per iteration.

---

## Open Questions

1. **Audio graph cycles** — The algorithm assumes a DAG. The Web Audio API permits cycles (e.g., a delay node in a feedback loop). Handling cycles is deferred.
