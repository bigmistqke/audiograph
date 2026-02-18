import { minni } from "@bigmistqke/minni";
import styles from "../App.module.css";
import { NodeContext, useGraph } from "../context";
import type { NodeInstance } from "../create-graph";
import { GraphPort } from "./GraphPort";

export function GraphNode(props: { node: NodeInstance }) {
  const { graph, setDragging } = useGraph();
  const typeDef = graph.config[props.node.type];

  const rendered = () => {
    if (!typeDef.render) return null;
    const entry = graph.nodeStates.get(props.node.id);
    return typeDef.render({
      state: entry?.state,
      setState: entry?.setState,
      dimensions: typeDef.dimensions,
    });
  };

  return (
    <NodeContext.Provider value={{ node: props.node, typeDef }}>
      <g transform={`translate(${props.node.x}, ${props.node.y})`}>
        <rect
          fill="white"
          stroke="black"
          width={typeDef.dimensions.x}
          height={typeDef.dimensions.y}
          onPointerDown={async (event) => {
            const startPos = { x: props.node.x, y: props.node.y };
            setDragging(true);
            await minni(event, (delta) => {
              graph.updateNode(props.node.id, {
                x: startPos.x + delta.x,
                y: startPos.y - delta.y,
              });
            });
            setDragging(false);
          }}
        />
        {rendered()}
        <g transform={`translate(${typeDef.dimensions.x - 20}, 5)`}>
          <foreignObject width="15" height="15">
            <button
              class={styles.deleteButton}
              onPointerDown={(event) => {
                event.stopPropagation();
                graph.deleteNode(props.node.id);
              }}
            ></button>
          </foreignObject>
        </g>
        {typeDef.ports.in.map((port: any, index: number) => (
          <GraphPort
            name={port.name}
            index={index}
            kind="in"
            dataKind={port.kind}
          />
        ))}
        {typeDef.ports.out.map((port: any, index: number) => (
          <GraphPort
            name={port.name}
            index={index}
            kind="out"
            dataKind={port.kind}
          />
        ))}
      </g>
    </NodeContext.Provider>
  );
}
