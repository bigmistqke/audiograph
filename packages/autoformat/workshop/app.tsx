import {
  type Graph,
  GraphEditor,
  GRID,
  type NodeTypeDef,
} from "@audiograph/graph";
import { action, createWritableStore, wait } from "@audiograph/utils";
import {
  createEffect,
  createMemo,
  createResource,
  For,
  mapArray,
  onCleanup,
} from "solid-js";
import { produce } from "solid-js/store";
import { autoformat } from "../src/index";
import styles from "./app.module.css";

// ─── Workshop node types ──────────────────────────────────────────────────────

function makeNodeDef(
  resizable: boolean,
): NodeTypeDef<Record<string, never>, null> {
  return {
    title: "node",
    dimensions: { x: 100, y: GRID * 8 },
    ports: {
      in: [{ name: "in" }],
      out: [{ name: "out" }],
    },
    state: {},
    resizable,
    construct: ({ id }) => {
      return {
        render: () => <div class={styles.nodeLabel}>{id}</div>,
      };
    },
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestCase {
  id: string;
  title: string;
  initial: Graph;
  expected: Graph;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

async function fetchCases(): Promise<TestCase[]> {
  try {
    const res = await fetch("/api/autoformat-cases");
    return await res.json();
  } catch {
    return [];
  }
}

async function saveCases(cases: TestCase[]) {
  await fetch("/api/save-autoformat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cases }),
  });
}

// ─── Position comparison ──────────────────────────────────────────────────────

interface AxisDiff {
  pass: boolean;
  mismatches: { id: string; expected: number; got: number }[];
}

interface Diff {
  x: AxisDiff;
  y: AxisDiff;
}

function compareAxis(
  expected: Graph,
  result: Graph,
  axis: "x" | "y",
): AxisDiff {
  const mismatches: AxisDiff["mismatches"] = [];
  for (const [id, node] of Object.entries(expected.nodes)) {
    const got = result.nodes[id]?.[axis];
    if (got === undefined) continue;
    if (Math.round(got) !== Math.round(node[axis])) {
      mismatches.push({
        id,
        expected: Math.round(node[axis]),
        got: Math.round(got),
      });
    }
  }
  return { pass: mismatches.length === 0, mismatches };
}

function compare(expected: Graph, result: Graph): Diff {
  return {
    x: compareAxis(expected, result, "x"),
    y: compareAxis(expected, result, "y"),
  };
}

// ─── Diff badges ─────────────────────────────────────────────────────────────

function AxisBadge(props: { diff: AxisDiff; axis: "x" | "y" }) {
  return (
    <div
      class={props.diff.pass ? styles.diffPass : styles.diffFail}
      title={
        props.diff.pass
          ? `All ${props.axis}-positions match`
          : props.diff.mismatches
              .map((m) => `${m.id}: expected ${m.expected}, got ${m.got}`)
              .join("\n")
      }
    >
      {props.diff.pass
        ? `✓ ${props.axis}`
        : `✗ ${props.axis} (${props.diff.mismatches.length})`}
    </div>
  );
}

// ─── Main route ───────────────────────────────────────────────────────────────

export function App() {
  const [_cases] = createResource(fetchCases, { initialValue: [] });
  const [cases, setCases] = createWritableStore(_cases);

  const save = action
    .phase("prepare save", () => wait())
    .phase("saving", () => saveCases(cases))
    .phase("saved", () => wait());

  const addCase = () => {
    setCases(
      produce((prev) =>
        prev.push({
          id: crypto.randomUUID(),
          title: "",
          initial: { nodes: {}, edges: [] },
          expected: { nodes: {}, edges: [] },
        }),
      ),
    );
  };

  const deleteCase = (index: number) => {
    setCases((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateCase = (index: number) => {
    setCases((prev) => {
      const copy = structuredClone(prev[index]!);
      copy.id = crypto.randomUUID();
      copy.title = "";
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  };

  const results = createMemo(
    mapArray(
      () => cases,
      (_case) => {
        return createMemo(() => autoformat(_case.initial));
      },
    ),
  );

  const diffs = createMemo(
    mapArray(results, (result, index) =>
      compare(cases[index()].expected, result()),
    ),
  );

  return (
    <div class={styles.root}>
      <header class={styles.header}>
        <h1 class={styles.title}>Autoformat Workshop</h1>
        <div class={styles.headerActions}>
          <button
            class={styles.saveBtn}
            onClick={save}
            disabled={save.pending()}
          >
            {save.phase() === "saving" || save.phase() === "prepare save"
              ? "Saving…"
              : save.phase() === "saved"
                ? "Saved!"
                : "Save"}
          </button>
          <button class={styles.addBtn} onClick={addCase}>
            + Add case
          </button>
        </div>
      </header>
      <div class={styles.body}>
        {/* ── Sidebar ── */}
        <nav class={styles.sidebar}>
          <For each={cases}>
            {(c, i) => (
              <a
                class={styles.sidebarLink}
                href={`#case-${c.id}`}
                data-pass={diffs()[i()]?.x.pass && diffs()[i()]?.y.pass}
              >
                <span class={styles.sidebarNum}>#{i() + 1}</span>
                <span class={styles.sidebarTitle}>{c.title || "untitled"}</span>
              </a>
            )}
          </For>
        </nav>

        {/* ── Cases ── */}
        <div class={styles.cases}>
          <For each={cases}>
            {(c, index) => {
              const diff = createMemo(() => diffs()[index()]!);
              const result = createMemo(() => results()[index()]());

              // Sync edges from Initial to Expected
              createEffect(
                mapArray(
                  () => cases[index()].initial.edges,
                  (edge, index) => {
                    createEffect(() => {
                      setCases(index(), "expected", "edges", index(), edge);

                      // Remove from Expected when edge is removed from Initial
                      onCleanup(() => {
                        setCases(
                          index(),
                          "expected",
                          "edges",
                          produce((edges) => {
                            edges.splice(index(), 1);
                          }),
                        );
                      });
                    });
                  },
                ),
              );

              // Per-node sync: seed on add, track dimensions, remove on cleanup
              createEffect(
                mapArray(
                  () => Object.keys(cases[index()].initial.nodes),
                  (key) => {
                    // Seed node in Expected if not yet present
                    if (!cases[index()].expected.nodes[key]) {
                      const node = cases[index()].initial.nodes[key];
                      setCases(index(), "expected", "nodes", key, {
                        ...node,
                        dimensions: { ...node.dimensions },
                      });
                    }

                    // Track dimension changes for this node
                    createEffect(() => {
                      const dims =
                        cases[index()].initial.nodes[key]?.dimensions;
                      if (dims) {
                        setCases(
                          index(),
                          "expected",
                          "nodes",
                          key,
                          "dimensions",
                          {
                            x: dims.x,
                            y: dims.y,
                          },
                        );
                      }
                    });

                    // Remove from Expected when node is removed from Initial
                    onCleanup(() => {
                      setCases(
                        index(),
                        "expected",
                        "nodes",
                        produce((nodes) => {
                          delete nodes[key];
                        }),
                      );
                    });
                  },
                ),
              );

              return (
                <div id={`case-${c.id}`} class={styles.row}>
                  <div class={styles.rowHeader}>
                    <span class={styles.caseNumber}>#{index() + 1}</span>
                    <AxisBadge diff={diff().x} axis="x" />
                    <AxisBadge diff={diff().y} axis="y" />
                    <input
                      class={styles.caseTitle}
                      placeholder="untitled"
                      value={c.title ?? ""}
                      onInput={(e) =>
                        setCases(index(), "title", e.currentTarget.value)
                      }
                    />
                    <span class={styles.caseId}>{c.id}.json</span>
                    <div class={styles.rowActions}>
                      <button
                        class={styles.duplicateBtn}
                        onClick={() => duplicateCase(index())}
                      >
                        ⧉
                      </button>
                      <button
                        class={styles.deleteBtn}
                        onClick={() => deleteCase(index())}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div class={styles.panels}>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Initial</span>
                      <GraphEditor
                        context={null}
                        config={{ node: makeNodeDef(true) }}
                        class={styles.graphPanel}
                        graphStore={cases[index()].initial}
                        setGraphStore={(...args: any[]) =>
                          // @ts-expect-error
                          setCases(index(), "initial", ...args)
                        }
                        onEdgeClick={({ edge, graph }) =>
                          graph.unlink(edge.output, edge.input)
                        }
                        onDoubleClick={({ x, y, graph }) => {
                          const existing = new Set(
                            Object.keys(cases[index()].initial.nodes),
                          );
                          const id =
                            Array.from({ length: 26 }, (_, n) =>
                              String.fromCharCode(65 + n),
                            ).find((l) => !existing.has(l)) ??
                            crypto.randomUUID();

                          graph.addNode("node", { x, y, id });
                        }}
                      />
                    </div>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Expected</span>
                      <GraphEditor
                        context={null}
                        config={{ node: makeNodeDef(false) }}
                        class={styles.graphPanel}
                        graphStore={cases[index()].expected}
                        setGraphStore={(...args: any[]) =>
                          // @ts-expect-error
                          setCases(index(), "expected", ...args)
                        }
                      />
                    </div>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Result</span>
                      <GraphEditor
                        context={null}
                        config={{ node: makeNodeDef(false) }}
                        class={styles.graphPanel}
                        graphStore={result()}
                        setGraphStore={() => {}}
                      />
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
