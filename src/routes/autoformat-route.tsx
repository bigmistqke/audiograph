import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  mapArray,
  onCleanup,
  onMount,
  Show,
  untrack,
} from "solid-js";
import { produce, SetStoreFunction } from "solid-js/store";
import { autoformat } from "~/lib/autoformat";
import { createWritableStore } from "~/lib/create-writable";
import { GRID } from "~/lib/graph/constants";
import type {
  Graph,
  GraphConfig,
  NodeTypeDef,
} from "~/lib/graph/create-graph-api";
import { GraphEditor } from "~/lib/graph/graph-editor";
import styles from "./autoformat-route.module.css";

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
    construct: ({ id }) => ({
      render: () => <div class={styles.nodeLabel}>{id}</div>,
    }),
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Persistence ─────────────────────────────────────────────────────────────

async function fetchCases(): Promise<TestCase[]> {
  try {
    const res = await fetch("/api/autoformat-cases");
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchCase(id: string): Promise<TestCase | null> {
  try {
    const res = await fetch(`/api/autoformat-case/${id}`);
    return await res.json();
  } catch {
    return null;
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

// ─── Comment thread ───────────────────────────────────────────────────────────

function CommentThread(props: {
  comments: Comment[];
  onAdd: (text: string) => void;
  collapsed: boolean;
}) {
  const [draft, setDraft] = createSignal("");

  const submit = () => {
    const text = draft().trim();
    if (!text) return;
    props.onAdd(text);
    setDraft("");
  };

  return (
    <Show when={!props.collapsed}>
      <div class={styles.commentThread}>
        <For each={props.comments}>
          {(comment) => (
            <div
              class={
                comment.role === "user"
                  ? styles.userComment
                  : styles.assistantComment
              }
            >
              <span class={styles.commentRole}>
                {comment.role === "user" ? "You" : "Claude"}
              </span>
              <p class={styles.commentText}>{comment.text}</p>
            </div>
          )}
        </For>
        <textarea
          class={styles.commentInput}
          placeholder="Add a note… (Enter to send, Shift+Enter for newline)"
          rows={2}
          value={draft()}
          onInput={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
      </div>
    </Show>
  );
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

function DiffBadges(props: { diff: Diff }) {
  return (
    <>
      <AxisBadge diff={props.diff.x} axis="x" />
      <AxisBadge diff={props.diff.y} axis="y" />
    </>
  );
}

// ─── Graph panel ─────────────────────────────────────────────────────────────

function GraphPanel(props: {
  config: GraphConfig<null>;
  graphStore: Graph;
  setGraphStore: (...args: any[]) => void;
  onEdgeClick?: ({ edge, graph }: any) => void;
}) {
  return (
    <GraphEditor
      config={props.config}
      context={null}
      graphStore={props.graphStore}
      setGraphStore={props.setGraphStore}
      class={styles.graphPanel}
      onClick={() => {}}
      onEdgeClick={props.onEdgeClick}
    />
  );
}

// ─── Main route ───────────────────────────────────────────────────────────────

export function AutoformatRoute() {
  const [_cases] = createResource(fetchCases);
  const [cases, _setCases] = createWritableStore(
    () => _cases() ?? ([] as Array<TestCase>),
  );

  const [shouldRefetch, setShouldRefetch] = createSignal(false, {
    equals: false,
  });
  const [saveStatus] = createResource(shouldRefetch, () => saveCases(cases));

  let timeout: ReturnType<typeof setTimeout>;
  const setCases: SetStoreFunction<Array<TestCase>> = (...args: Array<any>) => {
    // @ts-expect-error
    _setCases(...args);
    clearTimeout(timeout);
    timeout = setTimeout(() => setShouldRefetch(true), 1_000);
  };

  onMount(() => {
    // WebSocket: receive comment updates from file edits (e.g. by Claude)
    if (import.meta.hot) {
      import.meta.hot.on(
        "autoformat-updated",
        async ({ id }: { id: string }) => {
          if (saveStatus.state !== "ready") return;
          const index = cases.findIndex((c) => c.id === id);
          if (index === -1) return;
          const updated = await fetchCase(id);
          if (!updated) return;
          const cur = JSON.stringify(cases[index]!.comments);
          const next = JSON.stringify(updated.comments);
          if (cur !== next) {
            setCases(index, "comments", updated.comments);
          }
        },
      );
    }
  });

  const addCase = () => {
    setCases(
      produce((prev) =>
        prev.push({
          id: crypto.randomUUID(),
          title: "",
          comments: [],
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
      copy.comments = [];
      copy.id = crypto.randomUUID();
      copy.title = "";
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  };

  const diffs = createMemo(() =>
    cases.map((c) => compare(c.expected, autoformat(c.initial))),
  );

  return (
    <div class={styles.root}>
      <header class={styles.header}>
        <h1 class={styles.title}>Autoformat Workshop</h1>
        <div class={styles.headerActions}>
          <span class={styles.saveStatus}>
            {saveStatus.state === "refreshing" ? "Saving…" : ""}
          </span>
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
            {(c, i) => {
              const [collapsed, setCollapsed] = createSignal(true);
              const result = createMemo(() => autoformat(cases[i()].initial));
              const diff = createMemo(() => diffs()[i()]!);

              // Sync edges from Initial to Expected
              createEffect(() => {
                setCases(i(), "expected", "edges", [
                  ...cases[i()].initial.edges,
                ]);
              });

              // Per-node sync: seed on add, track dimensions, remove on cleanup
              createEffect(
                mapArray(
                  () => Object.keys(cases[i()].initial.nodes),
                  (key) => {
                    // Seed node in Expected if not yet present
                    if (untrack(() => !cases[i()].expected.nodes[key])) {
                      const node = untrack(
                        () => cases[i()].initial.nodes[key]!,
                      );
                      setCases(
                        i(),
                        "expected",
                        "nodes",
                        key,
                        structuredClone(node),
                      );
                    }

                    // Track dimension changes for this node
                    createEffect(() => {
                      const dims = cases[i()].initial.nodes[key]?.dimensions;
                      if (dims) {
                        setCases(i(), "expected", "nodes", key, "dimensions", {
                          x: dims.x,
                          y: dims.y,
                        });
                      }
                    });

                    // Remove from Expected when node is removed from Initial
                    onCleanup(() => {
                      setCases(
                        i(),
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
                <div
                  id={`case-${c.id}`}
                  class={styles.row}
                  style={{
                    "grid-template-rows": collapsed()
                      ? "auto minmax(300px, 1fr)"
                      : "auto auto minmax(300px, 1fr)",
                  }}
                >
                  <div class={styles.rowHeader}>
                    <span class={styles.caseNumber}>#{i() + 1}</span>
                    <DiffBadges diff={diff()} />
                    <input
                      class={styles.caseTitle}
                      placeholder="untitled"
                      value={c.title ?? ""}
                      onInput={(e) =>
                        setCases(i(), "title", e.currentTarget.value)
                      }
                    />
                    <span class={styles.caseId}>{c.id}.json</span>
                    <div class={styles.rowActions}>
                      <button
                        class={styles.collapseBtn}
                        onClick={() => setCollapsed((v) => !v)}
                        title={
                          collapsed() ? "Expand messages" : "Collapse messages"
                        }
                      >
                        {collapsed() ? "▸ msg" : "▾ msg"}
                      </button>
                      <button
                        class={styles.duplicateBtn}
                        onClick={() => duplicateCase(i())}
                      >
                        ⧉
                      </button>
                      <button
                        class={styles.deleteBtn}
                        onClick={() => deleteCase(i())}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <CommentThread
                    comments={cases[i()].comments}
                    collapsed={collapsed()}
                    onAdd={(text) =>
                      setCases(i(), "comments", (prev) => [
                        ...prev,
                        { role: "user" as const, text },
                      ])
                    }
                  />
                  <div class={styles.panels}>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Initial</span>
                      <GraphPanel
                        config={{ node: makeNodeDef(true) }}
                        graphStore={cases[i()].initial}
                        setGraphStore={(...args: any[]) =>
                          // @ts-expect-error
                          setCases(i(), "initial", ...args)
                        }
                        onEdgeClick={({ edge, graph }) =>
                          graph.unlink(edge.output, edge.input)
                        }
                      />
                    </div>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Expected</span>
                      <GraphPanel
                        config={{ node: makeNodeDef(false) }}
                        graphStore={cases[i()].expected}
                        setGraphStore={(...args: any[]) =>
                          // @ts-expect-error
                          setCases(i(), "expected", ...args)
                        }
                      />
                    </div>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Result</span>
                      <GraphPanel
                        config={{ node: makeNodeDef(false) }}
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
