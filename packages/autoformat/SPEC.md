# Autoformat Algorithm Spec

## Thesis

This algorithm is **prettier for audio graphs**.

Prettier takes messy code and reformats it into a clean, consistent structure — but it isn't purely mechanical. It respects some of your intent: if you put arguments on separate lines, prettier keeps them on separate lines. It's opinionated about _structure_, deferential about _ordering_.

This algorithm does the same thing for graphs:

- **Opinionated about structure**: nodes snap to a clean grid, x-positions follow strict alignment rules, y-positions are computed from a spatial interval structure.
- **Deferential about ordering**: the user's current y-positions of branch-start nodes determine which row each branch lands in. If you put one branch below another, the algorithm keeps it there.

The result is a layout that is always tidy, but still feels like _yours_.

The algorithm is **not** a single DFS traversal — it requires four sequential phases over a topological sort. The reason is a fundamental causal conflict: the Merge Alignment and Sequential rules are _forward causal_ ("given my parents' positions, place me"), while the Split Pull rule is _backward causal_ ("look downstream at a merge's final position, then pull myself upstream to fit"). A single forward pass cannot satisfy both directions simultaneously. See _Why Four Phases_ for details.

---

## Terminology

### Node Types

- **Simple node**: exactly one input, one output
- **Split node**: one input (or root), multiple outputs
- **Merge node**: multiple inputs, one output (or leaf)
- **Merge-split node**: multiple inputs AND multiple outputs

```
[A]──>[B]──>[C]          Simple (B): one input, one output

     ┌──>[B]
[A]──┤                   Split (A): one input, multiple outputs
     └──>[C]

[A]──┐
     ├──>[C]             Merge (C): multiple inputs, one output
[B]──┘

[A]──┐     ┌──>[C]
     ├──>[M]┤            Merge-split (M): multiple inputs AND outputs
[B]──┘     └──>[D]
```

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

```
Chain [A, D, E, C]:

[A]──>[D]──>[E]──>[C]
 ↑    └─ simple ─┘  ↑
split               merge

Chain [A, B]:

[A]──>[B]
 ↑     ↑
split  split (zero-internal chain)
```

### Row

A **row** is a set of chains that share the same top-Y coordinate. Chains in the same row may share boundary nodes (a merge node can be the end of one chain and the start of another in the same row), but their interiors never overlap.

Row ordering is determined by the **user's current y-positions of branch-start nodes** at each split: lower y = earlier row. This is the mechanism by which user intent is preserved — the relative vertical ordering of branches is respected, not recomputed from topology.

Row assignment is per-chain, not per-node. A boundary node that starts multiple chains has no single "home row"; each chain it starts may land in a different row.

```
     ┌──>[B]──>[C]──>[D]     ← Row 0 (B had lowest initial y)
[A]──┤              ↑
     └──>[E]────────┘         ← Row 1 (E had higher initial y)

A is a split. At A, outgoing branches are sorted by initial y:
  - B (lower y) → continues in current row (Row 0)
  - E (higher y) → opens new row (Row 1)
```

---

## Graph Preprocessing

Before topology analysis, the raw graph edges are normalized:

**Edge deduplication:** All edges between the same pair of nodes are collapsed into a single logical parent/child relationship. Sub-port distinctions (which specific input/output port was used) are ignored — the algorithm only considers whether a connection exists between two nodes, not how many times or via which ports.

This is a current design decision: the algorithm treats nodes as having a single logical input and output for the purpose of layout. Multi-port graphs where the same two nodes are connected via different port combinations are handled correctly as long as the layout only needs to know _that_ a connection exists.

---

## Algorithm

### Step 1: Topology Analysis

Identify all boundary nodes (split / merge / merge-split / root / leaf) and trace all chains between them.

### Step 2: Row Assignment + X-Positions

X-computation happens in **four sequential phases**. All phases use topological order (Kahn's algorithm) to guarantee parents are processed before children. The root queue in Kahn's algorithm is seeded in **top-left order** (smallest y, then smallest x) to ensure deterministic processing — without this, structurally equivalent graphs with different root insertion order could produce different layouts.

**Starting point:** The **primary root** — the root node with the smallest y, with x as tiebreaker (most top-left) — is anchored to its current position. Secondary roots are processed after the primary root's subtree is fully placed, in top-left order (smallest y, then smallest x).

#### Step 2a: Row Assignment

Process boundary nodes in topological order. At each node, sort its outgoing branches by the **current y-position of each branch's first node** (ascending):

- The branch with the **lowest initial y** continues in the **current row** (spine continuation).
- Each subsequent branch **opens a new row** below. If the end boundary is already row-assigned, the interior nodes of the chain still open their own row — only the end boundary keeps its existing row assignment.

Row-claiming is **first-come-first-served in y-order** across the whole traversal, with one exception: **merge and merge-split end boundaries prefer the highest-priority (lowest-index) row**. If a later chain reaches a merge that was previously assigned to a lower-priority row, the merge is updated to the higher-priority row.

```
     ┌──>[B]──>[C]──>[D]──>[F]     ← Row 0 (spine)
[A]──┤              ↑
     └──>[E]────────┘               ← Row 1

Row 0 chains: [A, B, C, D] and [D, F]  — B had lowest initial y (spine continuation)
Row 1 chain:  [A, E, D]               — E had higher initial y (new row)

D is a merge: first reached via Row 0, so D is assigned Row 0.
The Row 1 chain ends at D but D keeps its Row 0 assignment.
```

**Post-processing: non-spine merge correction.** After the main row assignment loop, a second pass pushes non-spine merges down to `max(parent rows)`. "Spine merges" — merges reached via a spine continuation path — are anchored to their spine parent's row and never move. All other merges may have been assigned too early to a row above their lowest parent; the post-processing corrects this.

This handles merge-before-split topologies where a merge node feeds into a split. Without post-processing, the merge could be assigned to a row above one of its parents (because it was first reached via a higher-priority chain), causing the downstream split to fan out from the wrong vertical position.

```
      ┌──>[B]──>[D]──>[F]──>[H]     ← Row 0 (spine)
[A]───┤
      ├──>[C]──>[M]──>[G]           ← Row 1
      │         ↑
      └──>[E]───┘                    ← Row 2

A's branches sorted by initial y: B (spine), C (Row 1), E (Row 2).
M is a merge (parents C and E), first reached via non-spine chain [A, C, M].
M is assigned Row 1 — it is NOT a spine merge.

Without post-processing: M stays at Row 1, but parent E is in Row 2.
M is above one of its parents — the fan-out from M starts too high.

With post-processing: M is non-spine, max(parent rows) = max(1, 2) = 2.
M is pushed from Row 1 to Row 2, now at or below all its parents.

Spine merges (reached via spine continuation) are never pushed down —
they are anchored to their spine parent's row.
```

#### Step 2b: Forward Pass

Walk all nodes in topological order, assigning **provisional** x-positions using the Anchor, Merge Alignment, and Sequential rules. Split Pulls are not applied yet — splits and secondary roots receive their Sequential provisional position here.

Merges get a provisional Merge Alignment position based on whichever parents have been processed so far in topological order. These positions are not final — merges are recomputed in Step 2d after all Split Pulls are known.

#### Step 2c: Split Pulls

Process splits in reverse topological order (post-order approximation), then secondary roots in y-order. For each, compute the best pull (see Split Pull rule), update x, and propagate the new position forward through any sequential (simple/leaf) nodes in the split's chains.

The Split Pull rule calls `computeMergeXWithoutSubtree` on target merges, which reads their parents' current x-positions — this is why the forward pass (2b) must run first, even though the merge positions it produces are provisional.

When no Split Pull target is reachable, splits stay at their Sequential position. Secondary roots with no reachable target default to x = 0.

#### Step 2d: Reconcile Pass

After all Split Pulls, recompute all non-fixed nodes in topological order using their final rules. Fixed nodes (primary root, splits, secondary roots — all placed in earlier phases) are kept as-is. For all others:

- **Merge Approach** nodes: computed for the first time here, using `xWithoutSubtree` to break circular dependencies (see Merge Approach rule)
- **Merge Alignment** nodes: recomputed from all parents' now-finalized positions
- **Sequential** nodes: recomputed sequentially from their single parent

This is the pass where merge positions become final. Each merge is computed exactly twice: a provisional position in 2b (so the Split Pull rule has something to evaluate), and a final position in 2d (after all splits have pulled).

### Step 3: Build Spatial Data Structure

After x-positions are finalized (Steps 2a–2d), build an **interval structure** indexed by x-range that tracks the maximum occupied bottom-Y for any x-span. Supports range queries: given `[x1, x2]`, return the maximum bottom-Y across that span.

### Step 4: Y Pass

Rows are the unit of y-placement — all nodes in a row share the same y-coordinate. Rows are processed in the order they are first encountered by the same DFS traversal as Step 2a (children visited in ascending initial-y order, each subtree fully exhausted before the next sibling). This is critical: it ensures that by the time a row is placed, all rows whose x-ranges might block it have already been inserted into the interval structure.

**Do not process rows in row-index order.** A row with a low index may need to be placed _after_ a row with a higher index if the higher-index row's subtree occupies an x-range that overlaps with the low-index row. The DFS traversal handles this automatically — branches that come later in the y-sorted sibling order are always processed after the earlier siblings' full subtrees.

```
                ┌──>[B]──>[C]──>[D]              Row 0 (spine)
                │         │
[A]─────────────┤         └──>[E]──>[F]          Row 2 (C's child)
                │
                └──>[G]──>[H]                    Row 1

DFS order visits: Row 0 → Row 2 → Row 1
  (NOT Row 0 → Row 1 → Row 2)

Row 0 is placed first. Then C's subtree is fully exhausted (Row 2)
before G's branch (Row 1) is visited. This ensures Row 2's occupied
x-range is recorded before Row 1 is placed — so Row 1 can query
whether its x-span overlaps with already-placed rows.
```

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

```
[A]──>[D]──>[E]──>[F]
 │                  ↑
 └──────────────────┘   (skip-edge: A→F, not used for x-alignment)

Only A→D (first node in chain) drives x-alignment.
The A→F skip-edge may produce a longer diagonal — that's accepted.
```

### Placement Rules

Every node's x-position is determined by exactly one rule. The rules form a priority hierarchy — the first matching rule wins.

#### Anchor Rule

**Applies to:** primary root.

The primary root is anchored to its current user position — it is never moved. All other nodes are placed relative to it.

```
[A]──>[B]──>[C]
 ↑
 primary root: stays at user position
 B, C placed relative to A
```

#### Merge Alignment Rule

**Applies to:** merge and merge-split nodes.

`x = max(parent.right for ALL parents) + gap`

All parents are considered regardless of row. Because merges are recomputed in the reconcile pass (Step 2d), they always reflect the final positions of every parent.

```
         ┌──>[B]──>[C]──>[D]──>[E]──┐
[A]──────┤                          ├──>[G]
         └──>[F]────────────────────┘

Assuming width=100, gap=30:
  A=0, B=130, C=260, D=390, E=520, F=130
  E.right = 620, F.right = 230

  G.x = max(E.right, F.right) + gap
      = max(620, 230) + 30 = 650

G aligns to its rightmost parent (E), not its closest one (F).
The long edge F→G is a consequence — the merge never "meets in the middle".
```

#### Merge Approach Rule

**Applies to:** the last internal node of a chain whose end boundary is a merge in a **strictly higher-priority row** (smaller row index) than the chain's start.

`x = max(prev.right + gap, end.xWithoutSubtree - width - gap)`

If the end boundary is not a merge, is in the same row, or is in a lower-priority row, the node falls through to the Sequential rule.

This rule is applied only during the reconcile pass (Step 2d). It uses `end.xWithoutSubtree` — the end merge's position excluding `start`'s subtree — rather than `end.x` directly. This breaks a circular dependency: the end merge's Merge Alignment position includes `lastInternal` as a parent, so reading `end.x` would be self-referential. `end.xWithoutSubtree` is computed as the max right-edge of the merge's parents that are **not** downstream of `start`, plus gap.

```
Row 0: [X]──>[Y]──>[Z]──>[W]──────>[D]
                                     ↑
Row 1: [A]──>[B]──>[C]──────────>[F]─┘

Chain [A, B, C, F, D]: starts at A (Row 1), ends at D (merge, Row 0).
D is in a higher-priority row → Merge Approach applies to F (last internal).

Without Merge Approach (Sequential):
  F.x = C.right + gap = 360 + 30 = 390

With Merge Approach:
  D.xWithoutSubtree = W.right + gap = 490 + 30 = 520  (excluding A's subtree)
  F.x = max(C.right + gap,  D.xWithoutSubtree - F.width - gap)
      = max(390, 520 - 100 - 30)
      = max(390, 390) = 390

  If the Row 0 path were longer, F would be pulled further right,
  keeping the cross-row edge to D short:

Row 0: [X]──>[Y]──>[Z]──>[W]──>[V]──>[U]──>[D]
                                            ↑
Row 1: [A]──>[B]──>[C]─────────────────>[F]─┘

  D.xWithoutSubtree = U.right + gap = 750 + 30 = 780
  F.x = max(390, 780 - 100 - 30) = max(390, 650) = 650

  F jumps from 390 to 650, approaching D closely.
```

#### Split Pull Rule

**Applies to:** split nodes and secondary roots with a reachable **independent** merge in the same or higher-priority row.

`x = merge.xWithoutSubtree - min_path_width` — or `x = max(prev.right + gap, merge.xWithoutSubtree - min_path_width)` if a prev exists.

- **Target merge:** Follow paths forward from S through any intermediate boundaries. Track `visitedBoundaries` to avoid revisiting the same boundary twice (handles DAG diamonds and same-row merges). Stop at the **first merge M with a strictly smaller row index** (higher-priority row) along the path. If multiple paths reach different first higher-priority merges, pick the one that gives the **largest x for S** (most constraining). If no higher-priority merge is reachable, a same-row merge is a valid fallback target. **Deepest-target-wins:** when traversing through a same-priority (same-row) merge, continue past it to search for deeper targets first. Only if no deeper target (primary or fallback) is found during that deeper traversal is the same-priority merge recorded as a fallback. This ensures the most constraining (deepest) target on a chain is used, rather than a shallow intermediate that would under-pull the split.
- `min_path_width` = `sum of widths of all nodes on the path from S to M (excluding M) + (number of those nodes) × gap`. Includes any intermediate boundary nodes traversed — not just simple internals.
- **Independence:** compute `merge.xWithoutSubtree` — M's x-position excluding S's subtree entirely. For each of M's parents: if the parent is downstream of S, skip it; otherwise include its right-edge. `merge.xWithoutSubtree = max(non-S-subtree parent right-edges) + gap`. M is independent of S if `merge.xWithoutSubtree` is finite (M has at least one parent not downstream of S). Use `merge.xWithoutSubtree` as the pull target — not M's full x.
- **Independence guarantees convergence.** If M is independent of S, its dominant position comes from outside S's subtree — finalized before S is evaluated in the post-order phase.
- **Secondary roots** (no prev): the pull alone determines x and can be negative — no `max(prev.right + gap, …)` guard. If no Split Pull target is reachable, secondary roots default to x = 0.

This rule unifies split-pull and secondary-root placement: both place a chain start so its full path fits exactly between itself and a downstream merge.

```
Secondary root pulled toward a shared merge (width=100, gap=30):

Without Split Pull (R defaults to x=0):

Row 0: [A]──>[B]──>[C]──>[D]──>[E]──>[F]──>[G]
        0    130   260   390   520   650   780
                                            ↑
Row 1: [R]──>[H]────────────────────────────┘
        0    130
        Long diagonal edge from H (x=130) to G (x=780)!

With Split Pull:

Row 0: [A]──>[B]──>[C]──>[D]──>[E]──>[F]──>[G]
        0    130   260   390   520   650   780
                                            ↑
Row 1:                          [R]──>[H]───┘
                                520   650

  G.xWithoutSubtree  = F.right + gap = 750 + 30 = 780  (F is not downstream of R)
  min_path_width = R.width + gap + H.width + gap = 100+30+100+30 = 260
  R.x = G.xWithoutSubtree - min_path_width = 780 - 260 = 520
  H.x = R.right + gap = 520 + 100 + 30 = 650

  R is pulled from x=0 to x=520. The cross-row edge (H→G) is now
  650+100+30 = 780 = G.x — a clean short connection.
```

Adding an edge can **promote** a node from simple → merge, making it a new chain boundary and splitting the chain it previously belonged to.

#### Sequential Rule

**Applies to:** all other nodes (simple nodes, leaves, secondary roots without a pull target).

`x = prev.right + gap`

```
[A]────>[B]────>[C]
x=0    x=130   x=260

Assuming width=100, gap=30:
  B.x = A.x + A.width + gap = 0 + 100 + 30 = 130
  C.x = B.x + B.width + gap = 130 + 100 + 30 = 260
```

---

## Why Four Phases

The algorithm cannot be reduced to a single traversal because **Split Pull operates in the opposite causal direction from Merge Alignment and Sequential**:

- **Merge Alignment and Sequential** are _forward causal_: "given my parents' positions, compute mine."
- **Split Pull** is _backward causal_: "look downstream at a merge's final position, then pull myself upstream to fit."

A single forward pass can satisfy one direction but not both. The four phases each resolve a specific dependency:

**Why the forward pass (2b) must come before Split Pulls (2c):**
Split Pull calls `computeMergeXWithoutSubtree` on target merges, which reads their parents' current x-positions. Those positions must exist before Split Pull can evaluate them — a forward pass is required to populate the x-map even if the results are provisional.

**Why Split Pull runs in reverse topological order:**
Deeper splits must pull before shallower ones. If a shallow split pulls first, its downstream chains shift — invalidating the `xWithoutSubtree` values that deeper splits would read. Processing in post-order ensures each split's pull propagates correctly without corrupting the inputs of splits higher in the graph.

**Why the reconcile pass (2d) is necessary:**
After Split Pulls, the nodes that moved are splits and sequential chains. But merges (Merge Alignment) haven't been updated to reflect their parents' new positions, and Merge Approach nodes haven't been computed at all. The reconcile pass fixes both:

- Merge Alignment nodes are recomputed with finalized parent positions.
- Merge Approach nodes can now safely read `end.xWithoutSubtree` — the end merge's Merge Alignment position is final, and using `xWithoutSubtree` rather than `end.x` avoids the self-referential dependency (the last internal is itself one of the merge's parents).

**Summary:** Forward pass → backward pulls → forward reconcile. Each direction resolves what the other direction leaves unresolved.

---

## Root Anchoring

The **primary root** is the root node with the smallest y, with x as tiebreaker (most top-left). It is anchored to its current user position — x and y are not recomputed. All other nodes are placed relative to it.

**Secondary roots** follow the Split Pull rule and can land at negative x if needed to fit their path before a shared downstream merge. They are processed after all splits have been pulled (Step 2c), in top-left order (smallest y, then smallest x).

---

## Islands

An **island** is a connected subgraph with no edges to any other subgraph. Each island is laid out independently using the same algorithm.

### Island Collision Resolution

After all islands are laid out independently, overlapping islands are resolved with a top-to-bottom sweep:

1. **Sort islands** by the y-position of their primary root (ascending). Islands higher on screen are processed first.
2. **Anchor each island's root** — the primary root of every island stays at its current user position; the island's internal layout is relative to it.
3. **Push down on overlap** — for each island (in sorted order), check whether its bounding box overlaps any already-placed island above it. If it does, shift the entire island downward until the gap between it and the lowest overlapping island above is exactly the standard gap (30px). Apply this shift to every node in the island uniformly.
4. **Cascade** — because islands are processed top-to-bottom, each shift only affects the current island and those below it. Earlier islands are never moved.

```
Before collision resolution:        After collision resolution:

[A]──>[B]                           [A]──>[B]              ← Island 1 (anchored)
[C]──>[D]──>[E]                        gap=30
                                    [C]──>[D]──>[E]        ← Island 2 (pushed down)
[F]                                    gap=30
                                    [F]                    ← Island 3 (pushed down)

Islands sorted by root y, then shifted down to maintain 30px gap.
```

---

## Optimizations

### 1. Descendant cache threading

`descCache` was previously created fresh on every `computeMergeXWithoutSubtree()` call, recomputing the same ancestor relationships O(N·M) times. One cache is now created per `pullSplitsTowardMerges()` / `reconcileXPositions()` call and threaded through.

### 2. Precomputed chains

`traceChain()` previously re-walked the same node paths in `assignRows()`, `findMergePullTarget()`, and `buildMergeApproachMap()`. `buildChainMap()` now traces all chains once immediately after topology and stores them in a `Map<startId, Map<firstChildId, string[]>>` lookup used by all passes.

### 3. Sorted interval structure with early-exit queries

`queryMaxBottomY()` previously did a full O(n) linear scan for every row placement. The interval array is now kept sorted by `xStart` (insertion sort on insert), and the query loop breaks early when `iv.xStart >= xEnd`.

### 4. Precomputed ancestor sets

`isDescendantOf()` previously recursed per-call, rewalking overlapping ancestor paths with a memoization cache. `buildAncestorSets()` now computes full ancestor sets for all nodes in one O(n) topological pass. All descendant checks use `Set.has()` lookups. `isDescendantOf` has been removed.

### 5. Hoisted info/width lookups in hot loops

`infos.get(pid)!.width` was called repeatedly inside `map()`/spread-max patterns in the forward pass and reconcile pass. Merge Alignment and Sequential paths now use explicit `for` loops with the `infos.get()` result cached once per iteration.

---

## Open Questions

1. **Audio graph cycles** — The algorithm assumes a DAG. The Web Audio API permits cycles (e.g., a delay node in a feedback loop). Handling cycles is deferred.
