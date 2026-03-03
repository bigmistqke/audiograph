// Reads a test case JSON (with initial but missing/empty expected),
// runs autoformat() on initial, and writes back the file with expected filled in.
//
// Usage: pnpm tsx scripts/fill-expected.ts <path-to-case.json>

import { readFileSync, writeFileSync } from "fs";
import { autoformat } from "../src/index.ts";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: pnpm tsx scripts/fill-expected.ts <path-to-case.json>");
  process.exit(1);
}

interface TestCase {
  id: string;
  title: string;
  initial: {
    nodes: Record<string, { id: string; type: string; x: number; y: number; width: number; height: number; state?: Record<string, unknown> }>;
    edges: Record<string, { output: { node: string; port: string }; input: { node: string; port: string } }>;
  };
  expected: Record<string, { x: number; y: number }>;
}

const raw = readFileSync(filePath, "utf8");
const testCase: TestCase = JSON.parse(raw);

// Ensure all nodes have state (autoformat requires it)
const graphWithState = {
  edges: testCase.initial.edges,
  nodes: Object.fromEntries(
    Object.entries(testCase.initial.nodes).map(([key, value]) => [
      key,
      { ...value, state: value.state ?? {} },
    ]),
  ),
};

const result = autoformat(graphWithState);

const expected: Record<string, { x: number; y: number }> = {};
for (const [id, node] of Object.entries(result.nodes)) {
  expected[id] = { x: node.x, y: node.y };
}

testCase.expected = expected;

writeFileSync(filePath, JSON.stringify(testCase, null, 2) + "\n");
console.log(`Filled expected for "${testCase.title}" (${Object.keys(expected).length} nodes)`);
