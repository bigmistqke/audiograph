import type { JSX } from "solid-js";
import type { RenderProps } from "./create-graph";
import { PORT_INSET, PORT_OFFSET, PORT_RADIUS, PORT_SPACING } from "./constants";
import styles from "./App.module.css";

export function createNodeComponent<S extends Record<string, any>>(
  title: string,
  content?: (props: RenderProps<S>) => JSX.Element,
) {
  return (props: RenderProps<S>) => {
    const inset = PORT_INSET + PORT_SPACING - PORT_RADIUS;
    return (
      <>
        <text x={inset} y={17} font-size="12" fill="black">
          {title}
        </text>
        {content && (
          <foreignObject
            x={inset}
            y={PORT_OFFSET - PORT_RADIUS}
            width={props.dimensions.x - inset * 2}
            height={props.dimensions.y - (PORT_OFFSET - PORT_RADIUS) - 5}
            class={styles.foreignObject}
          >
            {content(props)}
          </foreignObject>
        )}
      </>
    );
  };
}
