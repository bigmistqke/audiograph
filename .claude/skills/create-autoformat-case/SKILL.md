---
name: create-autoformat-case
description: Create a new autoformat test case from a graph description
argument-hint: [description of graph topology to test]
allowed-tools: Bash(cd:*), Bash(pnpm:*)
---

# Create Autoformat Case

Create a new autoformat test case JSON from a description of the graph topology.

## Usage

The user describes a graph topology (e.g. "diamond with 3 branches merging into a merge-split") and you translate it into the CLI format.

## Node format

`ID:x,y[,w,h]` — width and height default to 100,80.

Examples:
- `A:0,0` → node A at (0,0), 100x80
- `B:130,0,150,60` → node B at (130,0), 150x60

## Edge format

`SRC:port->DST:port`

Examples:
- `A:out->B:in`
- `S:out->M:in`

## CLI command

```bash
cd packages/autoformat && pnpm cases create \
  --title "descriptive title" \
  --nodes "A:0,0 B:130,0 C:130,110" \
  --edges "A:out->B:in A:out->C:in"
```

This automatically:
- Generates a UUID
- Runs `autoformat()` to compute expected positions
- Writes the JSON file
- Updates `index.json`
- Regenerates the test file

## Conventions

- **Node IDs**: Short alphabetic labels (A, B, C, ... or descriptive like S1, M1, MS)
- **Ports**: Use `out` for outputs, `in` for inputs
- **Initial positions**: Set intentionally — `initialY` values influence row ordering (children sorted by ascending initialY). Place the primary root at `0,0`. Place children with lower y above, higher y below.
- **Dimensions**: Default 100x80 unless testing size-dependent behavior

## After creating

Run tests to verify:
```bash
cd packages/autoformat && pnpm test
```

Summarize:
- The case title and ID
- The graph topology in ASCII
- Whether the test passes

The user will review the case visually in the workshop and correct `expected` if autoformat produced a buggy layout.
