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

function relabelGraph(graph: Graph): Graph {
  const idToLabel = new Map<string, string>();
  for (const node of Object.values(graph.nodes)) {
    idToLabel.set(node.id, (node.state as { label: string }).label);
  }

  const nodes: Graph["nodes"] = {};
  for (const node of Object.values(graph.nodes)) {
    const label = idToLabel.get(node.id)!;
    nodes[label] = { ...node, id: label };
  }

  const edges = graph.edges.map((edge) => ({
    output: { ...edge.output, node: idToLabel.get(edge.output.node)! },
    input: { ...edge.input, node: idToLabel.get(edge.input.node)! },
  }));

  return { nodes, edges };
}

function labelX(graph: Graph): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, node] of Object.entries(graph.nodes)) {
    result[id] = node.x;
  }
  return result;
}

function generateCase(testCase: TestCase): string {
  const description =
    testCase.title ||
    testCase.comments.find((c) => c.role === "user")?.text ||
    testCase.id;
  const initial = relabelGraph(testCase.initial);
  const expected = labelX(relabelGraph(testCase.expected));
  const initialStr = JSON.stringify(initial, null, 4)
    .split("\n")
    .join("\n    ");

  return `  it(${JSON.stringify(description)}, () => {
    const initial: Graph = ${initialStr};
    expect(labelX(autoformat(initial))).toEqual(${JSON.stringify(expected, null, 6).split("\n").join("\n    ")});
  });`;
}

const cases = ids.map((id) => {
  const data: TestCase = JSON.parse(
    readFileSync(join(casesDir, `${id}.json`), "utf8"),
  );
  return generateCase(data);
});

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

describe("autoformat — x-positions", () => {
${cases.join("\n\n")}
});
`;

const outPath = join(root, "src/lib/autoformat.test.ts");
writeFileSync(outPath, output);
console.log(`Generated ${cases.length} test cases → ${outPath}`);
