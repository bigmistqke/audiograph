// Generates src/autoformat.test.ts from public/autoformat-cases/*.json.
// Run with: pnpm generate:tests

import type { Edges, Nodes } from "@audiograph/create-graph";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface Graph {
  nodes: Nodes;
  edges: Edges;
}

interface TestCase {
  id: string;
  title: string;
  initial: Graph;
  expected: Record<string, { x: number; y: number }>;
}

const root = import.meta.dirname + "/..";
const casesDir = join(root, "public/autoformat-cases");

const ids: string[] = JSON.parse(
  readFileSync(join(casesDir, "index.json"), "utf8"),
);

function labelX(
  expected: Record<string, { x: number; y: number }>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, node] of Object.entries(expected)) {
    result[id] = node.x;
  }
  return result;
}

function labelY(
  expected: Record<string, { x: number; y: number }>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, node] of Object.entries(expected)) {
    result[id] = node.y;
  }
  return result;
}

function addStateToTestCaseInitial(graph: Graph) {
  return {
    edges: graph.edges,
    nodes: Object.fromEntries(
      Object.entries(graph.nodes).map(([key, value]) => [
        key,
        { ...value, state: {} },
      ]),
    ),
  };
}

function generateXCase(testCase: TestCase): string {
  const description = testCase.title || testCase.id;
  const expected = labelX(testCase.expected);
  const initialStr = JSON.stringify(
    addStateToTestCaseInitial(testCase.initial),
    null,
    4,
  )
    .split("\n")
    .join("\n    ");

  return `  it(${JSON.stringify(description)}, () => {
    const initial: Graph = ${initialStr};
    expect(labelX(autoformat(initial))).toMatchObject(${JSON.stringify(expected, null, 6).split("\n").join("\n    ")});
  });`;
}

function generateYCase(testCase: TestCase): string {
  const description = testCase.title || testCase.id;
  const expected = labelY(testCase.expected);
  const initialStr = JSON.stringify(
    addStateToTestCaseInitial(testCase.initial),
    null,
    4,
  )
    .split("\n")
    .join("\n    ");

  return `  it(${JSON.stringify(description)}, () => {
    const initial: Graph = ${initialStr};
    expect(labelY(autoformat(initial))).toMatchObject(${JSON.stringify(expected, null, 6).split("\n").join("\n    ")});
  });`;
}

const testCases = ids.map((id) => {
  const data: TestCase = JSON.parse(
    readFileSync(join(casesDir, `${id}.json`), "utf8"),
  );
  return data;
});

for (const tc of testCases) {
  if (Object.keys(tc.expected).length === 0) {
    throw new Error(`"${tc.title || tc.id}" has empty expected.nodes`);
  }
}

const xCases = testCases.map(generateXCase);
const yCases = testCases.map(generateYCase);

const output = `\
// AUTO-GENERATED — do not edit.
// Run \`pnpm generate:tests\` to regenerate.

import { describe, it, expect } from "vitest";
import { autoformat } from ".";
import type { Nodes, Edges } from "@audiograph/create-graph";

interface Graph {
  nodes: Nodes;
  edges: Edges;
}

function labelX(graph: Graph): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, node] of Object.entries(graph.nodes)) {
    result[id] = node.x;
  }
  return result;
}

function labelY(graph: Graph): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, node] of Object.entries(graph.nodes)) {
    result[id] = node.y;
  }
  return result;
}

describe("autoformat — x-positions", () => {
${xCases.join("\n\n")}
});

describe("autoformat — y-positions", () => {
${yCases.join("\n\n")}
});
`;

const outPath = join(root, "src/autoformat.test.ts");
writeFileSync(outPath, output);
console.log(`Generated ${testCases.length} test cases → ${outPath}`);
