// Generates src/lib/autoformat.test.ts from public/autoformat-cases/*.json.
// Run with: pnpm generate:autoformat-tests

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Graph } from "../src/lib/graph/create-graph-api";

interface Comment {
  role: "user" | "assistant";
  text: string;
}

interface TestCase {
  id: string;
  title: string;
  comments: Comment[];
  initial: Graph;
  expected: Graph;
}

const root = import.meta.dirname + "/..";
const casesDir = join(root, "public/autoformat-cases");

const ids: string[] = JSON.parse(
  readFileSync(join(casesDir, "index.json"), "utf8"),
);

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

function generateXCase(testCase: TestCase): string {
  const description =
    testCase.title ||
    testCase.comments.find((c) => c.role === "user")?.text ||
    testCase.id;
  const expected = labelX(testCase.expected);
  const initialStr = JSON.stringify(testCase.initial, null, 4)
    .split("\n")
    .join("\n    ");

  return `  it(${JSON.stringify(description)}, () => {
    const initial: Graph = ${initialStr};
    expect(labelX(autoformat(initial))).toEqual(${JSON.stringify(expected, null, 6).split("\n").join("\n    ")});
  });`;
}

function generateYCase(testCase: TestCase): string {
  const description =
    testCase.title ||
    testCase.comments.find((c) => c.role === "user")?.text ||
    testCase.id;
  const expected = labelY(testCase.expected);
  const initialStr = JSON.stringify(testCase.initial, null, 4)
    .split("\n")
    .join("\n    ");

  return `  it(${JSON.stringify(description)}, () => {
    const initial: Graph = ${initialStr};
    expect(labelY(autoformat(initial))).toEqual(${JSON.stringify(expected, null, 6).split("\n").join("\n    ")});
  });`;
}

const testCases = ids.map((id) => {
  const data: TestCase = JSON.parse(
    readFileSync(join(casesDir, `${id}.json`), "utf8"),
  );
  return data;
});

const xCases = testCases.map(generateXCase);
const yCases = testCases.map(generateYCase);

const output = `\
// AUTO-GENERATED — do not edit.
// Run \`pnpm generate:autoformat-tests\` to regenerate.

import { describe, it, expect } from "vitest";
import { autoformat } from "./autoformat";
import type { Graph } from "./graph/create-graph-api";

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

const outPath = join(root, "src/lib/autoformat.test.ts");
writeFileSync(outPath, output);
console.log(`Generated ${testCases.length} test cases → ${outPath}`);
