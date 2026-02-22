import { makePersisted } from "@solid-primitives/storage";
import { useNavigate, useParams } from "@solidjs/router";
import clsx from "clsx";
import { createResource, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { AudioGraphContext, builtIns } from "../built-ins";
import { GraphConfig, GraphStore } from "../graph/create-graph";
import { GraphEditor } from "../graph/graph-editor";
import envelopeProcessorUrl from "../lib/envelope-processor?url";
import sequencerProcessorUrl from "../lib/sequencer-processor?url";
import {
  createWorkletFileSystem,
  getSourceBoilerplate,
  getWorkletEntry,
} from "../lib/worklet-file-system";
import { Button } from "../ui/button";
import styles from "./graph-route.module.css";

const audioContext = new AudioContext();
const promise = Promise.all([
  audioContext.audioWorklet.addModule(envelopeProcessorUrl),
  audioContext.audioWorklet.addModule(sequencerProcessorUrl),
]);

export function GraphRoute() {
  const navigate = useNavigate();
  const params = useParams();
  const workletFS = createWorkletFileSystem();
  const [resource] = createResource(() => promise.then(() => true));
  const [config, setConfig] = createStore<GraphConfig<AudioGraphContext>>({
    ...builtIns,
  });
  const [selectedType, setSelectedType] = createSignal<string | undefined>();
  const [graphStore, setGraphStore] = makePersisted(
    createStore<GraphStore>({ nodes: {}, edges: [] }),
    {
      name: `audiograph-${params.id}`,
    },
  );

  function saveAsNewType(code: string, nodeId: string) {
    const name = prompt("Name for this node type:");
    if (!name?.trim()) return;
    const typeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    setConfig(typeName, {
      ...builtIns.audioworklet,
      title: name.trim(),
      state: { name: "", code },
    });
    setGraphStore("nodes", nodeId, { type: typeName });
  }

  function saveType(nodeId: string) {
    const node = graphStore.nodes[nodeId];
    if (!node) return;
    const typeName = node.type;
    const code = node.state?.code;
    if (!code || typeName === "audioworklet") return;

    // Update the config template
    setConfig(typeName, "state", "code", code);

    // Push code to all other nodes of the same type
    for (const [otherId, otherNode] of Object.entries(graphStore.nodes)) {
      if (otherNode.type === typeName && otherId !== nodeId) {
        setGraphStore("nodes", otherId, "state", "code", code);
        const name = otherNode.state?.name;
        if (name) {
          workletFS.writeFile(`/${name}/source.js`, code);
        }
      }
    }
  }

  // Derive custom types from persisted nodes
  for (const node of Object.values(graphStore.nodes)) {
    if (!config[node.type] && node.state?.code !== undefined) {
      setConfig(node.type, {
        ...builtIns.audioworklet,
        title: node.type,
        state: { name: "", code: node.state.code },
      });
    }
  }

  const context: AudioGraphContext = {
    get audioContext() {
      return audioContext;
    },
    workletFS,
    saveType,
    saveAsNewType,
  };

  return (
    <>
      <div class={styles.sidebar}>
        <For
          each={[
            {
              label: "Sources",
              types: ["oscillator", "constant", "noise"],
            },
            {
              label: "Effects",
              types: [
                "gain",
                "filter",
                "delay",
                "reverb",
                "compressor",
                "waveshaper",
                "panner",
              ],
            },
            {
              label: "Modulation",
              types: ["lfo", "envelope", "sequencer", "scale", "range"],
            },
            {
              label: "Analysis",
              types: ["analyser", "meter", "debug"],
            },
            { label: "Output", types: ["destination"] },
            { label: "Code", types: ["audioworklet"] },
            {
              label: "User",
              types: Object.keys(config).filter(
                (k) =>
                  ![
                    "oscillator",
                    "constant",
                    "noise",
                    "gain",
                    "filter",
                    "delay",
                    "reverb",
                    "compressor",
                    "waveshaper",
                    "panner",
                    "lfo",
                    "envelope",
                    "scale",
                    "range",
                    "sequencer",
                    "analyser",
                    "meter",
                    "debug",
                    "destination",
                    "audioworklet",
                  ].includes(k),
              ),
            },
          ]}
        >
          {(category) => (
            <Show when={category.types.length > 0}>
              <span class={styles.categoryLabel}>{category.label}</span>
              <div class={styles.categoryGrid}>
                <For each={category.types}>
                  {(type) => {
                    const portColor = () => {
                      const kind =
                        (config[type]?.ports?.out?.[0] as any)?.kind || "audio";
                      return `var(--color-port-${kind})`;
                    };
                    return (
                      <Button
                        class={clsx(
                          styles.button,
                          selectedType() === type && styles.selected,
                        )}
                        style={{
                          "--color-node": portColor(),
                        }}
                        onClick={() =>
                          setSelectedType((prev) =>
                            prev === type ? undefined : type,
                          )
                        }
                      >
                        {type}
                      </Button>
                    );
                  }}
                </For>
              </div>
            </Show>
          )}
        </For>
      </div>
      <div class={styles.topRight}>
        <span class={styles.graphName}>{params.id}</span>
        <Button
          onClick={() => {
            const name = prompt("New graph name:");
            if (name?.trim()) navigate(`/${name.trim()}`);
          }}
          class={styles.button}
        >
          new graph
        </Button>
        <Button
          onClick={() => {
            audioContext.resume();
          }}
          class={styles.button}
        >
          resume audio
        </Button>
      </div>
      <Show when={resource() && params.id}>
        {(graphName) => (
          <GraphEditor
            graphName={graphName()}
            context={context}
            config={config}
            setConfig={setConfig}
            store={graphStore}
            setStore={setGraphStore}
            onClick={({ x, y, graph }) => {
              const type = selectedType();
              if (!type) return;

              const typeDef = config[type];

              const id = graph.addNode(type, { x, y });

              if (typeDef?.state && "code" in typeDef.state) {
                const name = `custom-${id}`;
                const code = typeDef.state.code || getSourceBoilerplate();

                setGraphStore("nodes", id, "state", "name", name);
                setGraphStore("nodes", id, "state", "code", code);

                workletFS.writeFile(`/${name}/source.js`, code);
                workletFS.writeFile(
                  `/${name}/worklet.js`,
                  getWorkletEntry(name),
                );
              }
              setSelectedType(undefined);
            }}
          />
        )}
      </Show>
    </>
  );
}
