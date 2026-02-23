import { makePersisted } from "@solid-primitives/storage";
import clsx from "clsx";
import { createSignal, For, Setter, Show } from "solid-js";
import { createStore } from "solid-js/store";
import type {
  GraphConfig,
  GraphStore,
} from "~/lib/graph/create-graph-api";
import { GAP } from "~/lib/graph/constants";
import { GraphEditor } from "~/lib/graph/graph-editor";

import {
  createWorkletFileSystem,
  getSourceBoilerplate,
  getWorkletEntry,
} from "~/lib/worklet-file-system";
import { Button } from "~/ui/button";
import styles from "./audio-graph-editor.module.css";
import { AudioGraphContext, builtIns } from "./built-ins";

const audioContext = new AudioContext();

function SideBar(props: {
  config: GraphConfig<AudioGraphContext>;
  selectedNodeType: string | undefined;
  setSelectedNodeType: Setter<string | undefined>;
}) {
  return (
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
            types: Object.keys(props.config).filter(
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
                      (props.config[type]?.ports?.out?.[0] as any)?.kind ||
                      "audio";
                    return `var(--color-port-${kind})`;
                  };
                  return (
                    <Button
                      class={clsx(
                        styles.button,
                        props.selectedNodeType === type && styles.selected,
                      )}
                      style={{
                        "--color-node": portColor(),
                      }}
                      onClick={() =>
                        props.setSelectedNodeType((prev) =>
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
  );
}

function TopRightHUD(props: { id: string; onOpenProject(id: string): void }) {
  // const navigate = useNavigate();
  return (
    <div class={styles.topRight}>
      <span class={styles.graphName}>{props.id}</span>
      <Button
        onClick={() => {
          const name = prompt("New graph name:");
          if (name?.trim()) props.onOpenProject(name.trim());
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
  );
}

export function AudioGraphEditor(props: {
  id: string;
  onOpenProject(id: string): void;
}) {
  // const params = useParams();
  const workletFS = createWorkletFileSystem();
  const [config, setConfig] = createStore<GraphConfig<AudioGraphContext>>({
    ...builtIns,
  });
  const [selectedNodeType, setSelectedNodeType] = createSignal<
    string | undefined
  >();
  const [graphStore, setGraphStore] = makePersisted(
    createStore<GraphStore>({ nodes: {}, edges: [] }),
    {
      name: `audiograph-${props.id}`,
    },
  );

  // Initialize worklet files for persisted custom nodes
  for (const node of Object.values(graphStore.nodes)) {
    const { state } = graphStore.nodes[node.id];
    if (state?.name && state?.code) {
      const name = state.name;
      if (!workletFS.readFile(`/${name}/source.js`)) {
        workletFS.writeFile(`/${name}/source.js`, state.code);
        workletFS.writeFile(`/${name}/worklet.js`, getWorkletEntry(name));
      }
    }
  }

  function addUserAudioWorkletNode(code: string, nodeId: string) {
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

  function updateUserAudioWorkletNode(nodeId: string) {
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
    updateUserAudioWorkletNode,
    addUserAudioWorkletNode,
  };

  return (
    <>
      <SideBar
        config={config}
        selectedNodeType={selectedNodeType()}
        setSelectedNodeType={setSelectedNodeType}
      />
      <TopRightHUD id={props.id ?? ""} onOpenProject={props.onOpenProject} />
      <GraphEditor
        context={context}
        config={config}
        graphStore={graphStore}
        setGraphStore={setGraphStore}
        onClick={({ x, y, graph }) => {
          const type = selectedNodeType();
          if (!type) return;

          const typeDef = config[type];

          const id = graph.addNode(type, { x, y });

          if (typeDef?.state && "code" in typeDef.state) {
            const name = `custom-${id}`;
            const code = typeDef.state.code || getSourceBoilerplate();

            setGraphStore("nodes", id, "state", "name", name);
            setGraphStore("nodes", id, "state", "code", code);

            workletFS.writeFile(`/${name}/source.js`, code);
            workletFS.writeFile(`/${name}/worklet.js`, getWorkletEntry(name));
          }
          setSelectedNodeType(undefined);
        }}
        onEdgeSpliceValidate={(edge) => {
          const type = selectedNodeType();
          if (!type) return false;

          const typeDef = config[type];
          if (!typeDef) return false;

          const firstIn = typeDef.ports.in?.[0] as any;
          const firstOut = typeDef.ports.out?.[0] as any;
          if (!firstIn || !firstOut) return false;

          // Check output side of existing edge matches new node's first input
          const outputPortDef = (() => {
            const outputNode = graphStore.nodes[edge.output.node];
            if (!outputNode) return undefined;
            return config[outputNode.type]?.ports.out?.find(
              (p: any) => p.name === edge.output.port,
            ) as any;
          })();

          // Check input side of existing edge matches new node's first output
          const inputPortDef = (() => {
            const inputNode = graphStore.nodes[edge.input.node];
            if (!inputNode) return undefined;
            return config[inputNode.type]?.ports.in?.find(
              (p: any) => p.name === edge.input.port,
            ) as any;
          })();

          if (!outputPortDef || !inputPortDef) return false;

          return (
            outputPortDef.kind === firstIn.kind &&
            firstOut.kind === inputPortDef.kind
          );
        }}
        onEdgeClick={({ edge, x, y, graph }) => {
          const type = selectedNodeType();
          if (!type) return;

          const typeDef = config[type];

          // Place new node at the downstream node's position (same Y, just before it)
          const downstreamNode = graphStore.nodes[edge.input.node];
          if (!downstreamNode) return;

          const id = graph.addNode(type, {
            x: downstreamNode.x,
            y: downstreamNode.y,
          });

          if (typeDef?.state && "code" in typeDef.state) {
            const name = `custom-${id}`;
            const code = typeDef.state.code || getSourceBoilerplate();

            setGraphStore("nodes", id, "state", "name", name);
            setGraphStore("nodes", id, "state", "code", code);

            workletFS.writeFile(`/${name}/source.js`, code);
            workletFS.writeFile(`/${name}/worklet.js`, getWorkletEntry(name));
          }

          // Splice into the edge and push downstream nodes right
          graph.spliceNodeIntoEdge(edge, id);
          const newNode = graphStore.nodes[id];
          if (newNode) {
            graph.pushDownstream(edge.input.node, newNode.dimensions.x + GAP);
          }

          setSelectedNodeType(undefined);
        }}
      />
    </>
  );
}
