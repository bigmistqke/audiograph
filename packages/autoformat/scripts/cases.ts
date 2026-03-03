import { program } from "commander";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { autoformat } from "../src/index.ts";

const root = import.meta.dirname + "/..";
const casesDir = join(root, "public/autoformat-cases");
const indexPath = join(casesDir, "index.json");

interface TestCase {
  id: string;
  title: string;
  initial: {
    nodes: Record<string, { id: string; type: string; x: number; y: number; width: number; height: number; state?: Record<string, unknown> }>;
    edges: Record<string, { output: { node: string; port: string }; input: { node: string; port: string } }>;
  };
  expected: Record<string, { x: number; y: number }>;
}

function loadIndex(): string[] {
  return JSON.parse(readFileSync(indexPath, "utf8"));
}

function loadCase(id: string): TestCase {
  return JSON.parse(readFileSync(join(casesDir, `${id}.json`), "utf8"));
}

function loadAllCases(): TestCase[] {
  return loadIndex().map(loadCase);
}

// ── list ──

program
  .command("list")
  .description("List all test case titles")
  .action(() => {
    const cases = loadAllCases();
    const maxTitle = Math.max(...cases.map((c) => c.title.length), 5);
    console.log(`${"#".padEnd(3)} ${"Title".padEnd(maxTitle)}  ID`);
    console.log(`${"─".repeat(3)} ${"─".repeat(maxTitle)}  ${"─".repeat(36)}`);
    cases.forEach((c, i) => {
      console.log(`${String(i + 1).padEnd(3)} ${c.title.padEnd(maxTitle)}  ${c.id}`);
    });
  });

// ── search ──

program
  .command("search <query>")
  .description("Search test cases by title")
  .action((query: string) => {
    const lower = query.toLowerCase();
    const matches = loadAllCases().filter((c) =>
      c.title.toLowerCase().includes(lower),
    );
    if (matches.length === 0) {
      console.log(`No cases matching "${query}"`);
      return;
    }
    for (const c of matches) {
      console.log(`${c.id}  ${c.title}`);
    }
  });

// ── show ──

program
  .command("show <id>")
  .description("Show details of a test case")
  .action((id: string) => {
    // Support partial ID match
    const ids = loadIndex();
    const match = ids.find((i) => i.startsWith(id));
    if (!match) {
      console.error(`No case found matching "${id}"`);
      process.exit(1);
    }

    const c = loadCase(match);
    console.log(`\nTitle: ${c.title}`);
    console.log(`ID:    ${c.id}\n`);

    console.log("Nodes:");
    for (const [nid, node] of Object.entries(c.initial.nodes)) {
      const exp = c.expected[nid];
      const size = node.width !== 100 || node.height !== 80
        ? ` [${node.width}x${node.height}]`
        : "";
      const pos = exp
        ? `(${node.x},${node.y}) → (${exp.x},${exp.y})`
        : `(${node.x},${node.y})`;
      console.log(`  ${nid}${size}: ${pos}`);
    }

    console.log("\nEdges:");
    for (const [eid, edge] of Object.entries(c.initial.edges)) {
      console.log(`  ${edge.output.node}:${edge.output.port} → ${edge.input.node}:${edge.input.port}`);
    }
    console.log();
  });

// ── create ──

function parseNodes(input: string): TestCase["initial"]["nodes"] {
  const nodes: TestCase["initial"]["nodes"] = {};
  for (const token of input.trim().split(/\s+/)) {
    const [id, rest] = token.split(":");
    if (!id || !rest) {
      throw new Error(`Invalid node format "${token}". Expected ID:x,y[,w,h]`);
    }
    const parts = rest.split(",").map(Number);
    if (parts.length < 2 || parts.some(isNaN)) {
      throw new Error(`Invalid coordinates in "${token}". Expected ID:x,y[,w,h]`);
    }
    const [x, y, w = 100, h = 80] = parts;
    nodes[id] = { id, type: "node", x, y, width: w, height: h };
  }
  return nodes;
}

function parseEdges(input: string): TestCase["initial"]["edges"] {
  const edges: TestCase["initial"]["edges"] = {};
  for (const token of input.trim().split(/\s+/)) {
    const match = token.match(/^(\w+):(\w+)->(\w+):(\w+)$/);
    if (!match) {
      throw new Error(`Invalid edge format "${token}". Expected SRC:port->DST:port`);
    }
    const [, srcNode, srcPort, dstNode, dstPort] = match;
    edges[token] = {
      output: { node: srcNode, port: srcPort },
      input: { node: dstNode, port: dstPort },
    };
  }
  return edges;
}

program
  .command("create")
  .description("Create a new test case")
  .requiredOption("-t, --title <title>", "Test case title")
  .requiredOption("-n, --nodes <nodes>", 'Nodes: "A:0,0 B:130,0 C:130,110,150,60"')
  .requiredOption("-e, --edges <edges>", 'Edges: "A:out->B:in A:out->C:in"')
  .action((opts: { title: string; nodes: string; edges: string }) => {
    const id = randomUUID();
    const nodes = parseNodes(opts.nodes);
    const edges = parseEdges(opts.edges);

    // Add state to nodes for autoformat
    const graphWithState = {
      nodes: Object.fromEntries(
        Object.entries(nodes).map(([key, value]) => [
          key,
          { ...value, state: {} },
        ]),
      ),
      edges,
    };

    const result = autoformat(graphWithState);
    const expected: Record<string, { x: number; y: number }> = {};
    for (const [nid, node] of Object.entries(result.nodes)) {
      expected[nid] = { x: node.x, y: node.y };
    }

    const testCase: TestCase = {
      id,
      title: opts.title,
      initial: { nodes, edges },
      expected,
    };

    // Write case file
    const casePath = join(casesDir, `${id}.json`);
    writeFileSync(casePath, JSON.stringify(testCase, null, 2) + "\n");

    // Update index
    const index = loadIndex();
    index.push(id);
    writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");

    // Regenerate tests
    execSync("node scripts/generate-autoformat-tests.ts", { cwd: root, stdio: "inherit" });

    console.log(`\nCreated: ${casePath}`);
    console.log(`ID: ${id}`);
    console.log(`Title: ${opts.title}`);
    console.log(`Nodes: ${Object.keys(nodes).join(", ")}`);
    console.log(`Expected positions:`);
    for (const [nid, pos] of Object.entries(expected)) {
      console.log(`  ${nid}: (${pos.x}, ${pos.y})`);
    }
  });

program.parse();
