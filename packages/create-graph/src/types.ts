import type { JSX } from "solid-js";

export type InferStateFromGraphConfig<TConfig extends GraphConfig> =
  TConfig extends GraphConfig<infer U> ? U : never;
export type InferContextFromGraphConfig<TConfig extends GraphConfig> =
  TConfig extends GraphConfig<any, infer U> ? U : never;

export interface Node<
  TState extends Record<string, any> = Record<string, any>,
> {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  state: TState;
}

export interface EdgeHandle {
  node: string;
  port: string;
}

export interface Edge {
  output: EdgeHandle;
  input: EdgeHandle;
}

export type Nodes<TState extends Record<string, any> = Record<string, any>> =
  Record<string, Node<TState>>;

export type Edges = Record<string, Edge>;

export interface GraphEventHandlers<
  TState extends Record<string, any> = Record<string, any>,
> {
  onEdgeAdd?(event: { edgeId: string; edge: Edge }): void;
  onEdgeDelete?(event: { edgeId: string }): void;
  onNodeAdd?(event: { nodeId: string; node: Node<TState> }): void;
  onNodeDelete?(event: { nodeId: string }): void;
  onNodeUpdate?(event: {
    nodeId: string;
    callback(node: Node<TState>): Node<TState> | void;
  }): void;
}

export interface Connectable {
  connect(target: any): any;
  disconnect(target?: any): void;
}

export interface PortDefinition {
  name: string;
  [key: string]: unknown;
}

export interface NodeDefinition<
  TState extends Record<string, any> = Record<string, any>,
  TContext = any,
> {
  title?: string;
  dimensions: { width: number; height: number };
  ports: {
    in?: PortDefinition[];
    out?: PortDefinition[];
  };
  state?: TState;
  resizable?: boolean | "y";
  hideLabels?: boolean;
  construct(props: ConstructOptions<TState, TContext>): ConstructResult;
}

export interface ConstructOptions<
  TState extends Record<string, any> = Record<string, any>,
  TContext = any,
> extends GraphEventHandlers<TState> {
  id: string;
  nodes: Nodes;
  edges: Edges;
  context: TContext;
  state: TState;
  setState(setter: (state: TState) => TState | void): void;
  isInputConnected(portName: string): boolean;
}

export interface ConstructResult {
  in?: Record<string, AudioNode | AudioParam | undefined>;
  out?: Record<string, Connectable | undefined>;
  render?: () => JSX.Element;
}

export type GraphConfig<
  TState extends Record<string, any> = Record<string, any>,
  TContext = any,
> = GraphEventHandlers<TState> &
  Omit<
    {
      [key: string]: NodeDefinition<any, TContext>;
    },
    keyof GraphEventHandlers
  >;

export interface GraphAPI<
  TConfig extends GraphConfig = GraphConfig,
> extends GraphEventHandlers<
  TConfig extends GraphConfig<infer TState extends Record<string, any>>
    ? TState
    : never
> {
  config: TConfig;
  nodes: Nodes<InferStateFromGraphConfig<TConfig>>;
  edges: Edges;
  constructResults: Record<string, ConstructResult>;
  getPortDef: (nodeId: string, portName: string) => PortDefinition | undefined;
  addNode(options: {
    id?: string;
    type: keyof TConfig & string;
    x: number;
    y: number;
  }): string;
  deleteNode(id: string): void;
  deleteEdge(id: string): void;
  addEdge(edge: { id?: string; output: EdgeHandle; input: EdgeHandle }): void;
  updateNode(
    id: string,
    callback: (
      node: Node<InferStateFromGraphConfig<TConfig>>,
    ) => Node<InferStateFromGraphConfig<TConfig>> | void,
  ): void;
  /** Splice a node into an existing edge: A→B becomes A→node→B using first ports. */
  spliceNodeIntoEdge(edgeId: string, nodeId: string): void;
}

export interface CreateGraphAPIConfig<
  TConfig extends GraphConfig,
> extends GraphEventHandlers<InferStateFromGraphConfig<TConfig>> {
  nodes: Nodes<InferStateFromGraphConfig<TConfig>>;
  edges: Edges;
  config: TConfig;
  context: InferContextFromGraphConfig<TConfig>;
}
