---
name: debug-autoformat
description: Analyze the autoformat algorithm for potential bugs and edge cases
argument-hint: [focus area or specific concern]
allowed-tools: Read, Grep, Glob, Bash(cd:*), Bash(pnpm:*)
---

# Debug Autoformat

Analyze the autoformat layout algorithm for potential bugs, edge cases, or divergences from intended behavior.

## Algorithm Overview

The autoformat algorithm lives in `packages/autoformat/src/` and has these phases:

1. **Topology** (`analysis.ts`): Build node info, detect roles (root/leaf/simple/split/merge/merge-split), trace chains between boundary nodes, topological sort, ancestor sets
2. **Row Assignment** (`analysis.ts:assignRows`): Assign rows via chain traversal — spine gets parent's row, branches open new rows. Post-processing for orphaned boundaries and non-spine merges.
3. **X-Pass** (`x-pass.ts`): Initial x-positions → split pull toward merge targets → reconcile (run twice)
4. **Y-Pass** (`y-pass.ts`): DFS row order, IntervalStructure for max-bottom-Y queries, per-row y placement
5. **Island Collision** (`y-pass.ts`): Resolve collisions between disconnected subgraphs

Key rules: Anchor (primary root), Sequential (simple/leaf from parent), Merge Alignment (max parent right + gap), Split Pull (pull splits toward downstream merges), Merge Approach (last interior node before higher-priority merge).

## Your Task

When invoked:

1. **Read the algorithm source files**:
   - `packages/autoformat/src/analysis.ts` — topology, row assignment, chain building
   - `packages/autoformat/src/x-pass.ts` — x-positioning pipeline
   - `packages/autoformat/src/y-pass.ts` — y-positioning and island collisions
   - `packages/autoformat/src/types.ts` — types and IntervalStructure

2. **List existing test cases** to understand what's already covered:
   ```bash
   cd packages/autoformat && pnpm cases list
   ```

3. **Identify potential edge cases or bugs**, focusing on `$ARGUMENTS` if provided. Look for:
   - Boundary conditions in row assignment (orphaned rows, spine conflicts)
   - Split pull finding wrong or missing merge targets
   - Merge approach miscalculation
   - Reconcile not converging (cascading dependency issues)
   - Island collision edge cases
   - IntervalStructure query correctness
   - Topological sort tie-breaking edge cases
   - Cycles or unreachable nodes in unusual graph shapes
   - Chains with length 2 (boundary-to-boundary, no internals)
   - Multi-port connections between same node pair
   - Diamond patterns (split → ... → merge from multiple paths)
   - Deep nesting of splits within splits

## Output

For each identified issue, report:
- **What**: The specific code path or condition
- **Why**: Why it could produce incorrect results
- **Graph**: An ASCII diagram of a graph topology that would trigger it
- **Severity**: Whether it's a likely real bug, a theoretical edge case, or a cosmetic issue

If the user wants to turn findings into test cases, suggest using `/create-autoformat-case` with the appropriate topology.
