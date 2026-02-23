import { makePersisted } from "@solid-primitives/storage";
import clsx from "clsx";
import { createSignal, For, Setter, Show } from "solid-js";
import { createStore } from "solid-js/store";
import {
  GRID,
  PORT_INSET,
  PORT_RADIUS,
  snapToGrid,
  TITLE_HEIGHT,
} from "~/lib/graph/constants";
import type { GraphConfig, GraphStore } from "~/lib/graph/create-graph-api";
import { NodeShell } from "~/lib/graph/components/node-shell";
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
  const [cursorPos, setCursorPos] = createSignal<
    { x: number; y: number } | undefined
  >();
  const [portDragKind, setPortDragKind] = createSignal<
    "in" | "out" | undefined
  >();
  const [hoveredPortKind, setHoveredPortKind] = createSignal<
    "in" | "out" | undefined
  >();
  const [hoveredEdge, setHoveredEdge] = createSignal<
    | {
        output: { node: string; port: string };
        input: { node: string; port: string };
      }
    | undefined
  >();

  function isPortCompatible(
    handle: { node: string; port: string },
    kind: "in" | "out",
  ) {
    const type = selectedNodeType();
    if (!type) return false;
    const typeDef = config[type];
    const clickedNode = graphStore.nodes[handle.node];
    if (!clickedNode) return false;
    const clickedPortDef = config[clickedNode.type]?.ports[kind]?.find(
      (p: any) => p.name === handle.port,
    ) as any;
    if (!clickedPortDef) return false;
    if (kind === "in") {
      const firstOut = typeDef.ports.out?.[0] as any;
      return firstOut && firstOut.kind === clickedPortDef.kind;
    } else {
      const firstIn = typeDef.ports.in?.[0] as any;
      return firstIn && firstIn.kind === clickedPortDef.kind;
    }
  }

  const ghostNode = () => {
    const type = selectedNodeType();
    const pos = cursorPos();
    if (!type || !pos) return undefined;
    const typeDef = config[type];
    if (!typeDef) return undefined;
    const borderColor = `var(--color-port-${(typeDef.ports?.out?.[0] as any)?.kind || "audio"})`;

    // Anchor cursor at first output port when hovering/dragging from input or when node has no inputs
    const hasInputPorts = (typeDef.ports.in?.length ?? 0) > 0;
    const targetKind = portDragKind() ?? hoveredPortKind();
    const anchorAtOutput = targetKind === "in" || !hasInputPorts;
    const anchorX = anchorAtOutput
      ? typeDef.dimensions.x - PORT_INSET
      : PORT_INSET;
    const anchorY = TITLE_HEIGHT + PORT_RADIUS;

    // When hovering over a spliceable edge, snap ghost to center between nodes
    const edge = hoveredEdge();
    if (edge) {
      const upstreamNode = graphStore.nodes[edge.output.node];
      const downstreamNode = graphStore.nodes[edge.input.node];
      if (upstreamNode && downstreamNode) {
        const upstreamRight = upstreamNode.x + upstreamNode.dimensions.x;
        const centerX = snapToGrid(
          upstreamRight +
            (downstreamNode.x - upstreamRight - typeDef.dimensions.x) / 2,
        );
        const centerY = snapToGrid((upstreamNode.y + downstreamNode.y) / 2);
        return {
          x: centerX,
          y: centerY,
          dimensions: typeDef.dimensions,
          title: typeDef.title || type,
          borderColor,
          ports: typeDef.ports,
        };
      }
    }

    return {
      x: snapToGrid(pos.x - anchorX),
      y: snapToGrid(pos.y - anchorY),
      dimensions: typeDef.dimensions,
      title: typeDef.title || type,
      borderColor,
      ports: typeDef.ports,
    };
  };
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
        onCursorMove={setCursorPos}
        onEdgeHover={(event) => setHoveredEdge(event?.edge)}
        onNodePointerDown={({ node, nativeEvent, preventDefault, graph }) => {
          if (!nativeEvent.altKey) return;
          preventDefault();

          const typeDef = config[node.type];
          const inPorts = typeDef?.ports.in ?? [];
          const outPorts = typeDef?.ports.out ?? [];

          // Find edges connected to this node before deleting
          const incomingEdges = graphStore.edges.filter(
            (e) => e.input.node === node.id,
          );
          const outgoingEdges = graphStore.edges.filter(
            (e) => e.output.node === node.id,
          );

          graph.deleteNode(node.id);

          // Bridge A→B(deleted)→C into A→C when port kinds match
          for (const incoming of incomingEdges) {
            const inPortDef = inPorts.find(
              (p: any) => p.name === incoming.input.port,
            ) as any;
            if (!inPortDef) continue;
            for (const outgoing of outgoingEdges) {
              const outPortDef = outPorts.find(
                (p: any) => p.name === outgoing.output.port,
              ) as any;
              if (!outPortDef) continue;
              if (inPortDef.kind === outPortDef.kind) {
                graph.link(incoming.output, outgoing.input);
              }
            }
          }

          setSelectedNodeType(node.type);
        }}
        onClick={({ x, y, graph }) => {
          const type = selectedNodeType();
          if (!type) return;

          const typeDef = config[type];

          const hasInputPorts = (typeDef.ports.in?.length ?? 0) > 0;
          const anchorAtOutput = !hasInputPorts;
          const anchorX = anchorAtOutput
            ? typeDef.dimensions.x - PORT_INSET
            : PORT_INSET;
          const anchorY = TITLE_HEIGHT + PORT_RADIUS;

          const id = graph.addNode(type, {
            x: snapToGrid(x - anchorX),
            y: snapToGrid(y - anchorY),
          });

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
        onEdgeSpliceValidate={({ edge }) => {
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
        onEdgeClick={({ edge, graph }) => {
          const type = selectedNodeType();
          if (!type) return;

          const typeDef = config[type];

          const upstreamNode = graphStore.nodes[edge.output.node];
          const downstreamNode = graphStore.nodes[edge.input.node];
          if (!upstreamNode || !downstreamNode) return;

          // Create node at temporary position
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

          const newNode = graphStore.nodes[id];
          if (!newNode) return;

          const newNodeWidth = newNode.dimensions.x;
          const upstreamRight = upstreamNode.x + upstreamNode.dimensions.x;
          const availableGap = downstreamNode.x - upstreamRight;
          const requiredSpace = newNodeWidth + 4 * GRID;
          const surplus = Math.max(0, requiredSpace - availableGap);

          // Splice into the edge and only push by the surplus
          graph.spliceNodeIntoEdge(edge, id);
          if (surplus > 0) {
            graph.pushDownstream(edge.input.node, surplus);
          }

          // Center new node horizontally between upstream right edge and downstream left edge
          const actualDownstreamX =
            graphStore.nodes[edge.input.node]?.x ?? downstreamNode.x + surplus;
          const centerX = snapToGrid(
            upstreamRight +
              (actualDownstreamX - upstreamRight - newNodeWidth) / 2,
          );
          const centerY = snapToGrid((upstreamNode.y + downstreamNode.y) / 2);

          setGraphStore("nodes", id, "x", centerX);
          setGraphStore("nodes", id, "y", centerY);

          setSelectedNodeType(undefined);
          setHoveredEdge(undefined);
        }}
        onPortHover={({ handle, kind, preventDefault: preventInteraction }) => {
          const type = selectedNodeType();
          if (!type) return;
          if (!isPortCompatible(handle, kind)) {
            preventInteraction();
          } else {
            setHoveredPortKind(kind);
          }
        }}
        onPortHoverEnd={() => {
          setHoveredPortKind(undefined);
        }}
        onPortDragStart={({ handle, kind, preventDefault: preventDefault }) => {
          const type = selectedNodeType();
          if (!type) return;

          // Skip default edge behaviors when placing a new node
          preventDefault();

          if (!isPortCompatible(handle, kind)) return;

          // Port is compatible — track kind for ghost node
          setPortDragKind(kind);
        }}
        onPortDragEnd={({ handle, kind, x, y, graph }) => {
          const type = selectedNodeType();
          if (!type) {
            setPortDragKind(undefined);
            return;
          }

          const typeDef = config[type];

          const anchorAtOutput = kind === "in";
          const anchorX = anchorAtOutput
            ? typeDef.dimensions.x - PORT_INSET
            : PORT_INSET;
          const anchorY = TITLE_HEIGHT + PORT_RADIUS;
          const id = graph.addNode(type, {
            x: snapToGrid(x - anchorX),
            y: snapToGrid(y - anchorY),
          });

          if (typeDef?.state && "code" in typeDef.state) {
            const name = `custom-${id}`;
            const code = typeDef.state.code || getSourceBoilerplate();
            setGraphStore("nodes", id, "state", "name", name);
            setGraphStore("nodes", id, "state", "code", code);
            workletFS.writeFile(`/${name}/source.js`, code);
            workletFS.writeFile(`/${name}/worklet.js`, getWorkletEntry(name));
          }

          // Connect: new node's first compatible port ↔ the dragged port
          if (kind === "in") {
            const firstOut = typeDef.ports.out?.[0] as any;
            if (firstOut) {
              graph.link({ node: id, port: firstOut.name }, handle);
            }
          } else {
            const firstIn = typeDef.ports.in?.[0] as any;
            if (firstIn) {
              graph.link(handle, { node: id, port: firstIn.name });
            }
          }

          setSelectedNodeType(undefined);
          setPortDragKind(undefined);
        }}
      >
        <Show when={ghostNode()}>
          {(ghost) => <GhostNode {...ghost()} />}
        </Show>
      </GraphEditor>
    </>
  );
}

function GhostNode(props: {
  x: number;
  y: number;
  dimensions: { x: number; y: number };
  title: string;
  borderColor: string;
  ports?: {
    in?: { name: string; kind?: string }[];
    out?: { name: string; kind?: string }[];
  };
}) {
  return (
    <NodeShell {...props} opacity={0.4} pointer-events="none" />
  );
}
