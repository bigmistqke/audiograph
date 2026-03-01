import type {
  Edges,
  Node,
  NodeDefinition,
  Nodes,
} from "@audiograph/create-graph";
import { GraphEditor, GRID } from "@audiograph/svg-graph";
import { action, createWritableStore, wait } from "@audiograph/utils";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  mapArray,
} from "solid-js";
import { produce } from "solid-js/store";
import { autoformat } from "../src/index";
import styles from "./app.module.css";

interface Graph {
  nodes: Nodes;
  edges: Edges;
}

// ─── Workshop node types ──────────────────────────────────────────────────────

function makeNodeDef(
  resizable: boolean,
): NodeDefinition<Record<string, never>, null> {
  return {
    title: "node",
    dimensions: {
      width: 100,
      height: GRID * 8,
    },
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
  expected: Record<string, { x: number; y: number }>;
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
          initial: { nodes: {}, edges: {} },
          expected: {},
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

  const resultCases = createMemo(
    mapArray(
      () => cases,
      (_case) => {
        return createMemo(() => autoformat(_case.initial));
      },
    ),
  );

  const expectedCases = createMemo(
    mapArray(
      () => cases,
      (_case) => {
        return createMemo(() => ({
          edges: _case.initial.edges,
          nodes: Object.fromEntries(
            Object.entries(_case.expected).map(
              ([key, value]) =>
                [key, { ..._case.initial.nodes[key], ...value }] as const,
            ),
          ),
        }));
      },
    ),
  );

  const diffs = createMemo(
    mapArray(resultCases, (result, index) =>
      compare(expectedCases()[index()]!(), result()),
    ),
  );

  const paneHeights = createMemo(
    mapArray(
      () => cases,
      (_case) => {
        return createSignal(300);
      },
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
        <div
          class={styles.cases}
          style={{
            "grid-template-rows": paneHeights()
              .map((height) => `${height[0]()}px`)
              .join(" "),
          }}
        >
          <For each={cases}>
            {(c, index) => {
              const diff = createMemo(() => diffs()[index()]!);
              const result = createMemo(() => resultCases()[index()]());
              const expected = createMemo(() => expectedCases()[index()]!());

              // Per-node sync: seed on add, track dimensions, remove on cleanup
              createEffect(
                mapArray(
                  () => Object.keys(cases[index()].initial.nodes),
                  (key) => {
                    // Seed node in Expected if not yet present
                    if (!cases[index()].expected[key]) {
                      const node = cases[index()].initial.nodes[key];
                      setCases(index(), "expected", key, {
                        x: node.x,
                        y: node.y,
                      });
                    }
                  },
                ),
              );

              const onHandlePointerDown = (e: PointerEvent) => {
                const startY = e.clientY;
                const startH = paneHeights()[index()][0]();
                const onMove = (ev: PointerEvent) => {
                  paneHeights()[index()][1](
                    Math.max(80, startH + ev.clientY - startY),
                  );
                };
                const onUp = () => {
                  window.removeEventListener("pointermove", onMove);
                  window.removeEventListener("pointerup", onUp);
                };
                window.addEventListener("pointermove", onMove);
                window.addEventListener("pointerup", onUp);
              };

              return (
                <div
                  id={`case-${c.id}`}
                  class={styles.row}
                  // style={{ "grid-template-rows": `auto ${panelsHeight()}px auto` }}
                >
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
                        {...cases[index()].initial}
                        onNodeAdd={({ nodeId, node }) =>
                          setCases(
                            index(),
                            "initial",
                            "nodes",
                            produce((nodes) => {
                              nodes[nodeId] = node;
                            }),
                          )
                        }
                        onNodeDelete={({ nodeId }) =>
                          setCases(
                            index(),
                            "initial",
                            "nodes",
                            produce((nodes) => {
                              delete nodes[nodeId];
                            }),
                          )
                        }
                        onNodeUpdate={({ nodeId, callback }) => {
                          setCases(
                            index(),
                            "initial",
                            "nodes",
                            nodeId,
                            produce(callback),
                          );
                        }}
                        onEdgeAdd={({ edgeId, edge }) =>
                          setCases(
                            index(),
                            "initial",
                            "edges",
                            produce((edges) => {
                              edges[edgeId] = edge;
                            }),
                          )
                        }
                        onEdgeDelete={({ edgeId }) =>
                          setCases(
                            index(),
                            "initial",
                            "edges",
                            produce((edges) => {
                              delete edges[edgeId];
                            }),
                          )
                        }
                        onEdgeClick={({ edgeId, graph }) =>
                          graph.deleteEdge(edgeId)
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

                          graph.addNode({ type: "node", x, y, id });
                        }}
                      />
                    </div>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Expected</span>
                      <GraphEditor
                        {...expected()}
                        context={null}
                        config={{ node: makeNodeDef(false) }}
                        class={styles.graphPanel}
                        onNodeUpdate={({ nodeId, callback }) => {
                          setCases(
                            index(),
                            "expected",
                            nodeId,
                            produce((node) => {
                              callback(node as Node);
                            }),
                          );
                        }}
                      />
                    </div>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Result</span>
                      <GraphEditor
                        {...result()}
                        context={null}
                        config={{ node: makeNodeDef(false) }}
                        class={styles.graphPanel}
                      />
                    </div>
                  </div>
                  <div
                    class={styles.resizeHandle}
                    onPointerDown={onHandlePointerDown}
                  />
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
