import { For, createEffect, createSignal, on } from "solid-js";
import { createStore } from "solid-js/store";
import { GRID } from "~/lib/graph/constants";
import type {
  GraphConfig,
  GraphStore,
  NodeTypeDef,
} from "~/lib/graph/create-graph-api";
import { GraphEditor } from "~/lib/graph/graph-editor";
import styles from "./autoformat-route.module.css";

// ─── Workshop node type ───────────────────────────────────────────────────────

type WorkshopState = { label: string };

const workshopConfig: GraphConfig<null> = {
  node: {
    title: "node",
    dimensions: { x: 100, y: GRID * 8 },
    ports: {
      in: [{ name: "in" }],
      out: [{ name: "out" }],
    },
    state: { label: "" } as WorkshopState,
    resizable: "y",
    construct: ({ state }) => ({
      render: () => (
        <div class={styles.nodeLabel}>{(state as WorkshopState).label}</div>
      ),
    }),
  } satisfies NodeTypeDef<WorkshopState, null>,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Comment {
  role: "user" | "assistant";
  text: string;
}

interface TestCase {
  id: string;
  comments: Comment[];
  initial: GraphStore;
  expected: GraphStore;
}

interface State {
  cases: TestCase[];
}

const emptyGraphStore = (): GraphStore => ({ nodes: {}, edges: [] });

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

// ─── Comment thread ───────────────────────────────────────────────────────────

function CommentThread(props: {
  comments: Comment[];
  onAdd: (text: string) => void;
}) {
  const [draft, setDraft] = createSignal("");

  const submit = () => {
    const text = draft().trim();
    if (!text) return;
    props.onAdd(text);
    setDraft("");
  };

  return (
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
  );
}

// ─── Graph panel ─────────────────────────────────────────────────────────────

function GraphPanel(props: {
  graphStore: GraphStore;
  setGraphStore: (...args: any[]) => void;
  readonly?: boolean;
}) {
  const nextLabel = () => {
    const count = Object.keys(props.graphStore.nodes).length - 1;
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
              const id = graph.addNode("node", { x, y });
              props.setGraphStore("nodes", id, "state", "label", nextLabel());
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
  // Using `on(snapshot, ...)` so ready() is read but not tracked —
  // setReady(true) alone won't trigger a spurious save.
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
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  };

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
      <div class={styles.cases}>
        <For each={state.cases}>
          {(c, i) => (
            <div class={styles.row}>
              <div class={styles.rowHeader}>
                <span class={styles.caseNumber}>#{i() + 1}</span>
                <span class={styles.caseId}>{c.id}.json</span>
                <div class={styles.rowActions}>
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
                  <span class={styles.panelLabel}>Result (noop)</span>
                  <GraphPanel
                    graphStore={state.cases[i()].initial}
                    setGraphStore={() => {}}
                    readonly
                  />
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
