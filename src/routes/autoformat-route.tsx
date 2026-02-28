import { For, Show, createEffect, createMemo, createSignal, on } from "solid-js";
import { createStore } from "solid-js/store";
import { autoformat } from "~/lib/autoformat";
import { GRID } from "~/lib/graph/constants";
import type {
  Graph,
  GraphConfig,
  NodeTypeDef,
} from "~/lib/graph/create-graph-api";
import { GraphEditor } from "~/lib/graph/graph-editor";
import styles from "./autoformat-route.module.css";

// ─── Workshop node type ───────────────────────────────────────────────────────

const workshopConfig: GraphConfig<null> = {
  node: {
    title: "node",
    dimensions: { x: 100, y: GRID * 8 },
    ports: {
      in: [{ name: "in" }],
      out: [{ name: "out" }],
    },
    state: {},
    resizable: true,
    construct: ({ id }) => ({
      render: () => (
        <div class={styles.nodeLabel}>{id}</div>
      ),
    }),
  } satisfies NodeTypeDef<Record<string, never>, null>,
};

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

interface State {
  cases: TestCase[];
}

const emptyGraphStore = (): Graph => ({ nodes: {}, edges: [] });

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

// ─── X-position comparison ────────────────────────────────────────────────────

interface XDiff {
  pass: boolean;
  mismatches: { id: string; expected: number; got: number }[];
}

function compareX(expected: Graph, result: Graph): XDiff {
  const mismatches: XDiff["mismatches"] = [];
  for (const [id, node] of Object.entries(expected.nodes)) {
    const got = result.nodes[id]?.x;
    if (got === undefined) continue;
    if (Math.round(got) !== Math.round(node.x)) {
      mismatches.push({ id, expected: Math.round(node.x), got: Math.round(got) });
    }
  }
  return { pass: mismatches.length === 0, mismatches };
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

// ─── X diff badge ─────────────────────────────────────────────────────────────

function XDiffBadge(props: { diff: XDiff }) {
  return (
    <div
      class={props.diff.pass ? styles.diffPass : styles.diffFail}
      title={
        props.diff.pass
          ? "All x-positions match"
          : props.diff.mismatches
              .map((m) => `${m.id}: expected ${m.expected}, got ${m.got}`)
              .join("\n")
      }
    >
      {props.diff.pass
        ? "✓ x"
        : `✗ x (${props.diff.mismatches.length})`}
    </div>
  );
}

// ─── Graph panel ─────────────────────────────────────────────────────────────

function GraphPanel(props: {
  graphStore: Graph;
  setGraphStore: (...args: any[]) => void;
  readonly?: boolean;
}) {
  const nextId = () => {
    const count = Object.keys(props.graphStore.nodes).length;
    return String.fromCharCode(65 + (count % 26));
  };

  return (
    <GraphEditor
      config={workshopConfig}
      context={null}
      graphStore={props.graphStore}
      setGraphStore={props.setGraphStore}
      class={styles.graphPanel}
      onClick={
        props.readonly
          ? () => {}
          : ({ x, y, graph }) => {
              graph.addNode("node", { x, y, id: nextId() });
            }
      }
      onEdgeClick={
        props.readonly
          ? undefined
          : ({ edge, graph }) => {
              graph.unlink(edge.output, edge.input);
            }
      }
    />
  );
}

// ─── Main route ───────────────────────────────────────────────────────────────

export function AutoformatRoute() {
  const [state, setState] = createStore<State>({ cases: [] });
  const [ready, setReady] = createSignal(false);
  const [saveStatus, setSaveStatus] = createSignal<"idle" | "saving" | "saved">(
    "idle",
  );

  let isSaving = false;
  let saveTimer: ReturnType<typeof setTimeout>;
  let savedTimer: ReturnType<typeof setTimeout>;

  fetchCases().then((loaded) => {
    setState("cases", loaded);
    setReady(true);
  });

  // Autosave: debounced 1s after any state change.
  createEffect(
    on(
      () => JSON.stringify(state.cases),
      () => {
        if (!ready()) return;
        clearTimeout(saveTimer);
        setSaveStatus("idle");
        saveTimer = setTimeout(async () => {
          isSaving = true;
          setSaveStatus("saving");
          await saveCases(state.cases);
          isSaving = false;
          setSaveStatus("saved");
          clearTimeout(savedTimer);
          savedTimer = setTimeout(() => setSaveStatus("idle"), 2000);
        }, 1000);
      },
      { defer: true },
    ),
  );

  // WebSocket: receive comment updates from file edits (e.g. by Claude)
  if (import.meta.hot) {
    import.meta.hot.on("autoformat-updated", async ({ id }: { id: string }) => {
      if (isSaving) return;
      const index = state.cases.findIndex((c) => c.id === id);
      if (index === -1) return;
      const updated = await fetchCase(id);
      if (!updated) return;
      const cur = JSON.stringify(state.cases[index]!.comments);
      const next = JSON.stringify(updated.comments);
      if (cur !== next) {
        setState("cases", index, "comments", updated.comments);
      }
    });
  }

  const addCase = () => {
    setState("cases", (prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        comments: [],
        initial: emptyGraphStore(),
        expected: emptyGraphStore(),
      },
    ]);
  };

  const deleteCase = (index: number) => {
    setState("cases", (prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateCase = (index: number) => {
    setState("cases", (prev) => {
      const copy = structuredClone(prev[index]!);
      copy.comments = [];
      copy.id = crypto.randomUUID();
      copy.title = "";
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  };

  const diffs = createMemo(() =>
    state.cases.map((c) => compareX(c.expected, autoformat(c.initial))),
  );

  return (
    <div class={styles.root}>
      <header class={styles.header}>
        <h1 class={styles.title}>Autoformat Workshop</h1>
        <div class={styles.headerActions}>
          <span class={styles.saveStatus}>
            {saveStatus() === "saving"
              ? "Saving…"
              : saveStatus() === "saved"
                ? "Saved"
                : ""}
          </span>
          <button class={styles.addBtn} onClick={addCase}>
            + Add case
          </button>
        </div>
      </header>
      <div class={styles.body}>
        {/* ── Sidebar ── */}
        <nav class={styles.sidebar}>
          <For each={state.cases}>
            {(c, i) => (
              <a
                class={styles.sidebarLink}
                href={`#case-${c.id}`}
                data-pass={diffs()[i()]?.pass}
              >
                <span class={styles.sidebarNum}>#{i() + 1}</span>
                <span class={styles.sidebarTitle}>{c.title || "untitled"}</span>
              </a>
            )}
          </For>
        </nav>

        {/* ── Cases ── */}
        <div class={styles.cases}>
          <For each={state.cases}>
            {(c, i) => {
              const [collapsed, setCollapsed] = createSignal(true);
              const result = createMemo(() => autoformat(state.cases[i()].initial));
              const diff = createMemo(() => diffs()[i()]!);

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
                    <XDiffBadge diff={diff()} />
                    <input
                      class={styles.caseTitle}
                      placeholder="untitled"
                      value={c.title ?? ""}
                      onInput={(e) =>
                        setState("cases", i(), "title", e.currentTarget.value)
                      }
                    />
                    <span class={styles.caseId}>{c.id}.json</span>
                    <div class={styles.rowActions}>
                      <button
                        class={styles.collapseBtn}
                        onClick={() => setCollapsed((v) => !v)}
                        title={collapsed() ? "Expand messages" : "Collapse messages"}
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
                    comments={state.cases[i()].comments}
                    collapsed={collapsed()}
                    onAdd={(text) =>
                      setState("cases", i(), "comments", (prev) => [
                        ...prev,
                        { role: "user" as const, text },
                      ])
                    }
                  />
                  <div class={styles.panels}>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Initial</span>
                      <GraphPanel
                        graphStore={state.cases[i()].initial}
                        setGraphStore={(...args: any[]) =>
                          (setState as any)("cases", i(), "initial", ...args)
                        }
                      />
                    </div>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Expected</span>
                      <GraphPanel
                        graphStore={state.cases[i()].expected}
                        setGraphStore={(...args: any[]) =>
                          (setState as any)("cases", i(), "expected", ...args)
                        }
                      />
                    </div>
                    <div class={styles.panelWrap}>
                      <span class={styles.panelLabel}>Result</span>
                      <GraphPanel
                        graphStore={result()}
                        setGraphStore={() => {}}
                        readonly
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
