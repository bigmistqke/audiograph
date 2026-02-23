import type { JSX } from "solid-js";
import { Show } from "solid-js";
import {
  GRID,
  PORT_INSET,
  PORT_RADIUS,
  PORT_SPACING,
  TITLE_HEIGHT,
} from "../constants";
import styles from "./port.module.css";

export function PortShell(props: {
  name: string;
  index: number;
  kind: "in" | "out";
  width: number;
  dataKind?: string;
  hideLabels?: boolean;
  /** Props spread onto the hit-target circle (the larger invisible one). */
  hitTargetProps?: JSX.CircleSVGAttributes<SVGCircleElement>;
}) {
  const cx = () =>
    props.kind === "in" ? PORT_INSET : props.width - PORT_INSET;
  const cy = () => props.index * PORT_SPACING + TITLE_HEIGHT + PORT_RADIUS;
  const labelX = () =>
    props.kind === "in" ? `${GRID + 1}px` : `${props.width - GRID - 1}px`;

  return (
    <g>
      <Show when={!props.hideLabels}>
        <text
          x={labelX()}
          y={cy()}
          dy="0.35em"
          text-anchor={props.kind === "in" ? "start" : "end"}
          class={styles.label}
        >
          {props.name}
        </text>
      </Show>

      <circle
        cx={cx()}
        cy={cy()}
        r={PORT_RADIUS * 2}
        class={styles.portExtended}
        data-kind={props.dataKind}
        {...props.hitTargetProps}
      />
      <circle
        cx={cx()}
        cy={cy()}
        r={PORT_RADIUS}
        data-kind={props.dataKind}
        class={styles.port}
      />
    </g>
  );
}
