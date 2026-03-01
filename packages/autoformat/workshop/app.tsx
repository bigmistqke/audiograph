import type {
  Edges,
  Node,
  NodeDefinition,
  Nodes,
} from "@audiograph/create-graph";
import { GraphEditor, GRID } from "@audiograph/svg-graph";
import { action, createWritableStore, wait } from "@audiograph/utils";
import { useNavigate, useParams } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createResource,
  For,
  type ParentProps,
  Show,
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

// ─── Main app (router root) ──────────────────────────────────────────────────

export function App(props: ParentProps) {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [_cases] = createResource(fetchCases, { initialValue: [] });
  const [cases, setCases] = createWritableStore(_cases);

  const save = action
    .phase("prepare save", () => wait())
    .phase("saving", () => saveCases(cases))
    .phase("saved", () => wait());

  // Redirect to first case when no valid /:id
  createEffect(() => {
    if (cases.length === 0) return;
    if (!params.id || !cases.find((c) => c.id === params.id)) {
      navigate(`/${cases[0].id}`, { replace: true });
    }
  });

  const currentIndex = createMemo(() =>
    cases.findIndex((c) => c.id === params.id),
  );

  const addCase = () => {
    const id = crypto.randomUUID();
    setCases(
      produce((prev) =>
        prev.push({
          id,
          title: "",
          initial: { nodes: {}, edges: {} },
          expected: {},
        }),
      ),
    );
    navigate(`/${id}`);
  };

  const deleteCase = (index: number) => {
    const wasActive = index === currentIndex();
    setCases((prev) => prev.filter((_, i) => i !== index));
    if (wasActive && cases.length > 0) {
      const nextIndex = Math.min(index, cases.length - 1);
      navigate(`/${cases[nextIndex].id}`, { replace: true });
    }
  };

  const duplicateCase = (index: number) => {
    const id = crypto.randomUUID();
    setCases((prev) => {
      const copy = structuredClone(prev[index]!);
      copy.id = id;
      copy.title = "";
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
    navigate(`/${id}`);
  };

  const resultCase = createMemo(() => {
    const idx = currentIndex();
    if (idx === -1) return undefined;
    return autoformat(cases[idx].initial);
  });

  const expectedCase = createMemo(() => {
    const idx = currentIndex();
    if (idx === -1) return undefined;
    const c = cases[idx];
    return {
      edges: c.initial.edges,
      nodes: Object.fromEntries(
        Object.entries(c.expected).map(
          ([key, value]) =>
            [key, { ...c.initial.nodes[key], ...value }] as const,
        ),
      ),
    };
  });

  const diff = createMemo(() => {
    const result = resultCase();
    const expected = expectedCase();
    if (!result || !expected) return undefined;
    return compare(expected, result);
  });

  // Compute diffs for all cases (sidebar badges)
  const allDiffs = createMemo(() =>
    cases.map((c) => {
      const result = autoformat(c.initial);
      const expected = {
        edges: c.initial.edges,
        nodes: Object.fromEntries(
          Object.entries(c.expected).map(
            ([key, value]) =>
              [key, { ...c.initial.nodes[key], ...value }] as const,
          ),
        ),
      };
      return compare(expected, result);
    }),
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
                href={`/${c.id}`}
                data-pass={allDiffs()[i()]?.x.pass && allDiffs()[i()]?.y.pass}
                data-active={c.id === params.id}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/${c.id}`);
                }}
              >
                <span class={styles.sidebarNum}>#{i() + 1}</span>
                <span class={styles.sidebarTitle}>{c.title || "untitled"}</span>
              </a>
            )}
          </For>
        </nav>

        {/* ── Single case ── */}
        <Show when={currentIndex() !== -1}>
          {(() => {
            const index = currentIndex;
            const c = () => cases[index()];

            // Per-node sync: seed on add
            createEffect(() => {
              const idx = index();
              if (idx === -1) return;
              for (const key of Object.keys(cases[idx].initial.nodes)) {
                if (!cases[idx].expected[key]) {
                  const node = cases[idx].initial.nodes[key];
                  setCases(idx, "expected", key, {
                    x: node.x,
                    y: node.y,
                  });
                }
              }
            });

            return (
              <div class={styles.cases}>
                <div id={`case-${c().id}`} class={styles.row}>
                  <div class={styles.rowHeader}>
                    <span class={styles.caseNumber}>#{index() + 1}</span>
                    <Show when={diff()}>
                      {(d) => (
                        <>
                          <AxisBadge diff={d().x} axis="x" />
                          <AxisBadge diff={d().y} axis="y" />
                        </>
                      )}
                    </Show>
                    <input
                      class={styles.caseTitle}
                      placeholder="untitled"
                      value={c().title ?? ""}
                      onInput={(e) =>
                        setCases(index(), "title", e.currentTarget.value)
                      }
                    />
                    <span class={styles.caseId}>{c().id}.json</span>
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
                      <Show when={expectedCase()}>
                        {(expected) => (
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
                        )}
                      </Show>
                    </div>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Result</span>
                      <Show when={resultCase()}>
                        {(result) => (
                          <GraphEditor
                            {...result()}
                            context={null}
                            config={{ node: makeNodeDef(false) }}
                            class={styles.graphPanel}
                          />
                        )}
                      </Show>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Show>
      </div>
    </div>
  );
}
