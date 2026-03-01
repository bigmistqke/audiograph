import { autoformat } from "@audiograph/autoformat";
import type {
  EdgeHandle,
  Edges,
  GraphAPI,
  GraphConfig,
  Nodes,
} from "@audiograph/create-graph";
import {
  GraphEditor,
  GRID,
  NodeShell,
  PORT_INSET,
  PORT_RADIUS,
  snapToGrid,
  TITLE_HEIGHT,
} from "@audiograph/svg-graph";
import { makePersisted } from "@solid-primitives/storage";
import clsx from "clsx";
import { createSignal, For, type Setter, Show } from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
import {
  createWorkletFileSystem,
  getSourceBoilerplate,
  getWorkletEntry,
} from "~/lib/worklet-file-system";
import { Button } from "~/ui/button";
import styles from "./audio-graph-editor.module.css";
import { type AudioGraphContext, builtIns } from "./built-ins";

const audioContext = new AudioContext();

interface Graph {
  nodes: Nodes;
  edges: Edges;
}

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
                      props.config[type]?.ports?.out?.[0]?.kind || "audio";
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

function TopRightHUD(props: {
  id: string;
  onOpenProject(id: string): void;
  onAutoformat(): void;
}) {
  // const navigate = useNavigate();
  return (
    <div class={styles.topRight}>
      <span class={styles.graphName}>{props.id}</span>
      <Button onClick={props.onAutoformat} class={styles.button}>
        autoformat
      </Button>
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
  const [config, setConfig] = createStore<GraphConfig>({
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
  const [hoveredEdgeId, setHoveredEdgeId] = createSignal<string | undefined>();

  const [graphStore, setGraphStore] = makePersisted(
    createStore<Graph>({ nodes: {}, edges: {} }),
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

  function isPortCompatible(handle: EdgeHandle, kind: "in" | "out") {
    const type = selectedNodeType();
    if (!type) return false;
    const typeDef = config[type];
    const clickedNode = graphStore.nodes[handle.node];
    if (!clickedNode) return false;
    const clickedPortDef = config[clickedNode.type]?.ports[kind]?.find(
      (p) => p.name === handle.port,
    );
    if (!clickedPortDef) return false;
    if (kind === "in") {
      const firstOut = typeDef.ports.out?.[0];
      return firstOut && firstOut.kind === clickedPortDef.kind;
    } else {
      const firstIn = typeDef.ports.in?.[0];
      return firstIn && firstIn.kind === clickedPortDef.kind;
    }
  }

  /** Walk downstream from a node, fixing overlaps. Stops when gap is already sufficient. */
  function resolveOverlaps(startNodeId: string, minGap = GRID * 3) {
    let currentId: string | undefined = startNodeId;
    const visited = new Set<string>();
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const node = graphStore.nodes[currentId];
      if (!node) break;
      const upstreamRight = node.x + node.width;

      const edge = Object.values(graphStore.edges).find(
        (e) => e.output.node === currentId,
      );
      if (!edge) break;
      const downstream = graphStore.nodes[edge.input.node];
      if (!downstream) break;

      // Stop if gap is already sufficient
      if (downstream.x >= upstreamRight + minGap) break;

      setGraphStore(
        "nodes",
        edge.input.node,
        "x",
        snapToGrid(upstreamRight + minGap),
      );
      currentId = edge.input.node;
    }
  }

  /** Create a node of selectedNodeType, splice it into an edge, center it, and resolve overlaps. */
  function spliceSelectedOntoEdge(
    edgeId: string,
    graph: GraphAPI<GraphConfig<AudioGraphContext>>,
  ) {
    const type = selectedNodeType();
    if (!type) return;

    const edge = graphStore.edges[edgeId];

    const typeDef = config[type];
    const upstreamNode = graphStore.nodes[edge.output.node];
    const downstreamNode = graphStore.nodes[edge.input.node];
    if (!upstreamNode || !downstreamNode) return;

    const nodeId = graph.addNode({
      type,
      x: downstreamNode.x,
      y: downstreamNode.y,
    });

    if (typeDef?.state && "code" in typeDef.state) {
      const name = `custom-${nodeId}`;
      const code = typeDef.state.code || getSourceBoilerplate();
      setGraphStore("nodes", nodeId, "state", "name", name);
      setGraphStore("nodes", nodeId, "state", "code", code);
      workletFS.writeFile(`/${name}/source.js`, code);
      workletFS.writeFile(`/${name}/worklet.js`, getWorkletEntry(name));
    }

    const newNode = graphStore.nodes[nodeId];
    if (!newNode) return;

    const newNodeWidth = newNode.width;
    const upstreamRight = upstreamNode.x + upstreamNode.width;

    graph.spliceNodeIntoEdge(edgeId, nodeId);

    const gap = downstreamNode.x - upstreamRight;
    const minGap = GRID * 3;
    // Center only if there's enough room; otherwise place right after upstream
    const centerX =
      gap >= newNodeWidth + minGap * 2
        ? snapToGrid(upstreamRight + (gap - newNodeWidth) / 2)
        : snapToGrid(upstreamRight + minGap);
    const centerY = snapToGrid((upstreamNode.y + downstreamNode.y) / 2);

    setGraphStore("nodes", nodeId, "x", centerX);
    setGraphStore("nodes", nodeId, "y", centerY);

    resolveOverlaps(nodeId);

    setSelectedNodeType(undefined);
    setHoveredEdgeId(undefined);
  }

  function ghostNode() {
    const type = selectedNodeType();
    const pos = cursorPos();

    if (!type || !pos) {
      return undefined;
    }

    const typeDef = config[type];

    if (!typeDef) {
      return undefined;
    }

    const borderColor = `var(--color-port-${typeDef.ports?.out?.[0]?.kind || "audio"})`;

    // Anchor cursor at first output port when hovering/dragging from input or when node has no inputs
    const hasInputPorts = (typeDef.ports.in?.length ?? 0) > 0;
    const targetKind = portDragKind() ?? hoveredPortKind();
    const anchorAtOutput = targetKind === "in" || !hasInputPorts;
    const anchorX = anchorAtOutput
      ? typeDef.dimensions.width - PORT_INSET
      : PORT_INSET;
    const anchorY = TITLE_HEIGHT + PORT_RADIUS;

    // When hovering over a spliceable edge, snap ghost to center between nodes
    const edgeId = hoveredEdgeId();
    if (edgeId) {
      const edge = graphStore.edges[edgeId];
      const upstreamNode = graphStore.nodes[edge.output.node];
      const downstreamNode = graphStore.nodes[edge.input.node];
      if (upstreamNode && downstreamNode) {
        const upstreamRight = upstreamNode.x + upstreamNode.width;
        const centerX = snapToGrid(
          upstreamRight +
            (downstreamNode.x - upstreamRight - typeDef.dimensions.width) / 2,
        );
        const centerY = snapToGrid((upstreamNode.y + downstreamNode.y) / 2);
        return {
          x: centerX,
          y: centerY,
          ...typeDef.dimensions,
          title: typeDef.title || type,
          borderColor,
          ports: typeDef.ports,
        };
      }
    }

    return {
      x: snapToGrid(pos.x - anchorX),
      y: snapToGrid(pos.y - anchorY),
      ...typeDef.dimensions,
      title: typeDef.title || type,
      borderColor,
      ports: typeDef.ports,
    };
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

  return (
    <>
      <SideBar
        config={config}
        selectedNodeType={selectedNodeType()}
        setSelectedNodeType={setSelectedNodeType}
      />
      <TopRightHUD
        id={props.id ?? ""}
        onOpenProject={props.onOpenProject}
        onAutoformat={() => setGraphStore(reconcile(autoformat(graphStore)))}
      />
      <GraphEditor
        context={context}
        config={config}
        nodes={graphStore.nodes}
        edges={graphStore.edges}
        onEdgeAdd={({ edgeId, edge }) => setGraphStore("edges", edgeId, edge)}
        onEdgeDelete={({ edgeId }) =>
          setGraphStore(
            "edges",
            produce((edges) => delete edges[edgeId]),
          )
        }
        onNodeAdd={({ nodeId, node }) => setGraphStore("nodes", nodeId, node)}
        onNodeDelete={({ nodeId }) =>
          setGraphStore(
            "nodes",
            produce((nodes) => delete nodes[nodeId]),
          )
        }
        onNodeUpdate={({ nodeId, callback }) => {
          setGraphStore("nodes", nodeId, produce(callback));
        }}
        onCursorMove={setCursorPos}
        onEdgeHover={({ edgeId }) => setHoveredEdgeId(edgeId)}
        onClick={({ x, y, graph }) => {
          const type = selectedNodeType();
          if (!type) return;

          const typeDef = config[type];

          // If hovering an edge, splice into it
          const edge = hoveredEdgeId();
          if (edge) {
            spliceSelectedOntoEdge(edge, graph);
            return;
          }

          const hasInputPorts = (typeDef.ports.in?.length ?? 0) > 0;
          const anchorAtOutput = !hasInputPorts;
          const anchorX = anchorAtOutput
            ? typeDef.dimensions.width - PORT_INSET
            : PORT_INSET;
          const anchorY = TITLE_HEIGHT + PORT_RADIUS;

          const id = graph.addNode({
            type,
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
        onEdgeClick={({ edgeId, graph }) => {
          spliceSelectedOntoEdge(edgeId, graph);
        }}
        onEdgeSpliceValidate={({ edge }) => {
          const type = selectedNodeType();
          if (!type) return false;

          const typeDef = config[type];
          if (!typeDef) return false;

          const firstIn = typeDef.ports.in?.[0];
          const firstOut = typeDef.ports.out?.[0];
          if (!firstIn || !firstOut) return false;

          // Check output side of existing edge matches new node's first input
          const outputPortDef = (() => {
            const outputNode = graphStore.nodes[edge.output.node];
            if (!outputNode) return undefined;
            return config[outputNode.type]?.ports.out?.find(
              (p) => p.name === edge.output.port,
            );
          })();

          // Check input side of existing edge matches new node's first output
          const inputPortDef = (() => {
            const inputNode = graphStore.nodes[edge.input.node];
            if (!inputNode) return undefined;
            return config[inputNode.type]?.ports.in?.find(
              (p) => p.name === edge.input.port,
            );
          })();

          if (!outputPortDef || !inputPortDef) return false;

          return (
            outputPortDef.kind === firstIn.kind &&
            firstOut.kind === inputPortDef.kind
          );
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
            ? typeDef.dimensions.width - PORT_INSET
            : PORT_INSET;
          const anchorY = TITLE_HEIGHT + PORT_RADIUS;
          const id = graph.addNode({
            type,
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
            const firstOut = typeDef.ports.out?.[0];
            if (firstOut) {
              graph.addEdge({
                output: { node: id, port: firstOut.name },
                input: handle,
              });
            }
          } else {
            const firstIn = typeDef.ports.in?.[0];
            if (firstIn) {
              graph.addEdge({
                output: handle,
                input: { node: id, port: firstIn.name },
              });
            }
          }

          setSelectedNodeType(undefined);
          setPortDragKind(undefined);
        }}
      >
        <Show when={ghostNode()}>{(ghost) => <GhostNode {...ghost()} />}</Show>
      </GraphEditor>
    </>
  );
}

function GhostNode(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  borderColor: string;
  ports?: {
    in?: { name: string; kind?: string }[];
    out?: { name: string; kind?: string }[];
  };
}) {
  return <NodeShell {...props} opacity={0.4} pointer-events="none" />;
}
