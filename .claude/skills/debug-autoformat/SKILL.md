---
name: debug-autoformat
description: Analyze the autoformat algorithm for potential bugs and generate test case JSON files that exercise edge cases
argument-hint: [focus area or specific concern]
allowed-tools: Read, Grep, Glob, Bash(pnpm:*), Bash(cd:*), Write, Edit
---

# Debug Autoformat

Analyze the autoformat layout algorithm for potential bugs and create test case JSON files that exercise the identified edge cases.

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

1. **Read the algorithm source files** to understand the current implementation:
   - `packages/autoformat/src/analysis.ts` — topology, row assignment, chain building
   - `packages/autoformat/src/x-pass.ts` — x-positioning pipeline
   - `packages/autoformat/src/y-pass.ts` — y-positioning and island collisions
   - `packages/autoformat/src/types.ts` — types and IntervalStructure

2. **Identify potential edge cases or bugs**, focusing on `$ARGUMENTS` if provided. Look for:
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

3. **For each identified edge case**, create a test case JSON file.

## Test Case JSON Format

```json
{
  "id": "<uuid>",
  "title": "<descriptive title explaining what this tests>",
  "initial": {
    "nodes": {
      "A": { "id": "A", "type": "node", "x": 0, "y": 0, "width": 100, "height": 80 },
      "B": { "id": "B", "type": "node", "x": 200, "y": 0, "width": 100, "height": 80 }
    },
    "edges": {
      "A:out->B:in": {
        "output": { "node": "A", "port": "out" },
        "input": { "node": "B", "port": "in" }
      }
    }
  },
  "expected": {}
}
```

Conventions:
- **Node IDs**: Use short alphabetic labels (A, B, C, ...) for readability
- **Edge IDs**: Use semantic `"Source:port->Target:port"` format
- **Dimensions**: Default to `width: 100, height: 80` unless testing size-dependent behavior
- **Initial positions**: Set `x` and `y` to plausible pre-format positions. The initial y-values influence row ordering (children sorted by initialY), so set them intentionally to test the desired ordering. x=0,y=0 for the primary root is typical.
- **`expected`**: Leave as `{}` — it will be filled by the script

## Workflow

For each test case:

1. **Generate a UUID** for the case:
   ```bash
   uuidgen | tr '[:upper:]' '[:lower:]'
   ```

2. **Write the JSON** to `packages/autoformat/public/autoformat-cases/<uuid>.json` with `"expected": {}`

3. **Fill expected** by running autoformat on the initial graph:
   ```bash
   cd packages/autoformat && pnpm tsx scripts/fill-expected.ts public/autoformat-cases/<uuid>.json
   ```

4. **Add the UUID** to `packages/autoformat/public/autoformat-cases/index.json`

5. **Regenerate tests**:
   ```bash
   cd packages/autoformat && pnpm generate:tests
   ```

6. **Run tests** to verify they pass:
   ```bash
   cd packages/autoformat && pnpm test
   ```

## Output

After creating all cases, summarize:
- What edge cases you identified and why they could be problematic
- Which test case files you created
- Whether all tests pass (if a test fails, that's interesting — it might indicate a real bug)

The user will then review the cases visually in the autoformat workshop (`autoformat/workshop`) and correct any `expected` values that represent buggy behavior.
