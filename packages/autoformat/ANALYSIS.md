# Autoformat Package Analysis

## 1. Performance & Reliability

### Highest-Impact Issues

| Priority | Issue | Location |
|----------|-------|----------|
| **Medium** | `reconcileXPositions` called exactly twice — may be insufficient for deep cascades (3+ nested split-merge). A fixed-point loop would be more correct. | `x-pass.ts:494-506` |
| **Medium** | No cycle detection in Kahn's algorithm — cyclic graphs silently drop nodes. | `analysis.ts:192-220` |
| **Medium** | `buildAncestorSets` is O(N²) in deep chains (each node copies parent's full set). Lazy reachability would be cheaper. | `analysis.ts:229-249` |
| **Low** | `IntervalStructure.insert()` uses `Array.splice` — O(N) per insert, O(N²) total. An interval tree would help at scale. | `types.ts:88-93` |
| **Low** | `queue.shift()` in BFS/Kahn's is O(N) per call. Easy fix: use an index pointer. | `analysis.ts:26-27` |
| **Low** | `propagateSequential` is recursive — can stack-overflow on very long chains. | `x-pass.ts:127-155` |
| **Low** | `row: 0` hardcoded in output `LayoutNode` — actual row data from `rowOf` is computed but discarded. Bug or dead field. | `index.ts:58` |
| **Very Low** | `[...order].reverse()` copies the array unnecessarily, `rowHeight` in y-pass computed but unused. | `x-pass.ts:341`, `y-pass.ts:47` |

## 2. SPEC.md vs Implementation

### Discrepancies

| # | SPEC says | Implementation does |
|---|-----------|---------------------|
| 1 | **"Three x-pass sub-phases"** (lines 16, 228-230, 454-475) | **Four**: `reconcileXPositions` is called **twice** (`x-pass.ts:504-505`). The "Why Three Sub-Phases" section is inaccurate. |
| 2 | **Reconcile keeps splits/secondary roots "as-is"** (line 248) | Reconcile **re-pulls them leftward** (`x-pass.ts:408-427`). Only primary root is truly fixed. |
| 3 | **rowOrder sorted by "minimum initial y of their nodes"** (line 226) | Uses initialY of the **first node in topological order** assigned to each row (`analysis.ts:466-486`), not the minimum. |
| 4 | **Island collision: single-pass x-only query** (lines 492-498) | **Iterative do-while loop** with y-aware collision checking via `queryMaxBottomYColliding` (`y-pass.ts:96-134`). |
| 5 | **Ancestor set: "O(n) topological pass"** (line 149) | Actual complexity is O(N × avg ancestor set size), potentially O(N²). |

### Implemented but Undocumented

1. **Orphaned leaf chain reassignment** — `analysis.ts:346-374`
2. **`queryMaxBottomYColliding` method** — `types.ts:104-124`
3. **Double reconcile for cascading deps** — `x-pass.ts:504-505`
4. **Split Pull fallback asymmetry** — same-row uses deepest-target-wins, lower-priority rows do not

## 3. Positive-Coordinate Assumptions

The codebase is mostly clean — all coordinate storage uses `Map<string, number>`, no array-index-based lookups, no `Math.max(0, ...)` clamping, no `x >= 0` guards.

### Remaining Concerns

| Severity | Issue | Location |
|----------|-------|----------|
| **Medium** | `rowOf.get(...) ?? 0` fallback — silently maps missing entries to highest-priority row 0, could mask bugs | `analysis.ts:422,436` and `x-pass.ts:179,221` |
| **Low** | `maxParentRow = 0` init — correct for current non-negative row indices but fragile | `analysis.ts:384` |
| **Low** | Secondary roots default to `x = 0` when no merge pull target exists — may be far from primary root if it's at e.g. `x = -500` | `x-pass.ts:53` |

The `?? 0` pattern is the most concerning: if any node is unexpectedly absent from `rowOf`, it silently gets the highest-priority row rather than failing visibly. This isn't a negative-coordinate bug per se, but it could mask future bugs.
