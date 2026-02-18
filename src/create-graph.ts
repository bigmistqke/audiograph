import { createStore, produce } from "solid-js/store";

export interface Node {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ports: {
    in: string[];
    out: string[];
  };
}

export interface EdgeHandle {
  node: string;
  port: number;
}

export interface Edge {
  from: EdgeHandle;
  to: EdgeHandle;
}

export interface Graph {
  nodes: Array<Node>;
  edges: Array<Edge>;
}

export interface GraphAPI {
  graph: Graph;
  addNode(_node: Omit<Node, "id">): Node;
  deleteNode(id: string): void;
  link(from: EdgeHandle, to: EdgeHandle): void;
  updateNode(id: string, node: Partial<Node>): void;
}

let ID = 0;

export function createGraph(): GraphAPI {
  const [graph, setGraph] = createStore<Graph>({ nodes: [], edges: [] });

  return {
    graph,
    addNode(_node: Omit<Node, "id">) {
      const node: Node = { id: (ID++).toString(), ..._node };
      setGraph(
        "nodes",
        produce((nodes) => nodes.push(node)),
      );
      return node;
    },
    deleteNode(id: string) {
      setGraph(
        produce((graph) => {
          graph.nodes.splice(
            graph.nodes.findIndex((node) => node.id === id),
            1,
          );
          graph.edges = graph.edges.filter(
            (edge) => edge.from.node === id || edge.to.node === id,
          );
        }),
      );
    },
    link(from: EdgeHandle, to: EdgeHandle) {
      setGraph(
        "edges",
        produce((edges) => edges.push({ from, to })),
      );
    },
    updateNode(id: string, node: Partial<Node>) {
      setGraph(
        "nodes",
        produce((nodes) => {
          const nodeIndex = nodes.findIndex((node) => node.id === id);
          nodes[nodeIndex] = { ...nodes[nodeIndex], ...node };
        }),
      );
    },
  };
}
