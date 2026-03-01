import type { JSX } from "solid-js";
import { headerHeight } from "../constants";
import { PortShell } from "./port-shell";
import styles from "./node.module.css";

export function NodeShell(props: {
  x: number;
  y: number;
  dimensions: { x: number; y: number };
  title: string;
  borderColor: string;
  ports?: {
    in?: { name: string; kind?: string }[];
    out?: { name: string; kind?: string }[];
  };
  hideLabels?: boolean;
  selected?: boolean;
  children?: JSX.Element;
  headerChildren?: JSX.Element;
  headerProps?: JSX.HTMLAttributes<HTMLDivElement>;
  /** Override default static port rendering with interactive ports. */
  portSlot?: JSX.Element;
  style?: JSX.CSSProperties;
  "pointer-events"?: "none" | "auto";
  opacity?: number;
}) {
  const maxPorts = () =>
    Math.max(
      props.ports?.in?.length ?? 0,
      props.ports?.out?.length ?? 0,
    );

  const contentY = () => headerHeight(maxPorts());

  return (
    <g
      transform={`translate(${props.x}, ${props.y})`}
      style={{ "--color-node": props.borderColor, ...props.style }}
      pointer-events={props["pointer-events"]}
      opacity={props.opacity}
    >
      <foreignObject width={props.dimensions.x} height={props.dimensions.y}>
        <div
          class={styles.node}
          data-selected={props.selected || undefined}
        >
          <div
            class={styles.nodeHeader}
            style={{ height: `${contentY()}px` }}
            {...props.headerProps}
          >
            <div class={styles.nodeTitle}>{props.title}</div>
            {props.headerChildren}
          </div>
          {props.children}
        </div>
      </foreignObject>
      {props.portSlot ?? (
        <>
          {props.ports?.in?.map((port, i) => (
            <PortShell
              name={port.name}
              index={i}
              kind="in"
              width={props.dimensions.x}
              dataKind={port.kind}
              hideLabels={props.hideLabels}
            />
          ))}
          {props.ports?.out?.map((port, i) => (
            <PortShell
              name={port.name}
              index={i}
              kind="out"
              width={props.dimensions.x}
              dataKind={port.kind}
              hideLabels={props.hideLabels}
            />
          ))}
        </>
      )}
    </g>
  );
}
