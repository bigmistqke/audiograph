import clsx from "clsx";
import type { JSX } from "solid-js";
import { Show, splitProps } from "solid-js";
import {
  GRID,
  PORT_INSET,
  PORT_RADIUS,
  PORT_SPACING,
  TITLE_HEIGHT,
} from "../constants";
import styles from "./port.module.css";

export interface PortShellProps extends Omit<
  JSX.CircleSVGAttributes<SVGCircleElement>,
  "cx" | "cy" | "r"
> {
  name: string;
  index: number;
  kind: "in" | "out";
  width: number;
  dataKind?: string;
  hideLabels?: boolean;
}

export function PortShell(_props: PortShellProps) {
  const [props, rest] = splitProps(_props, [
    "name",
    "index",
    "kind",
    "width",
    "dataKind",
    "hideLabels",
  ]);
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
        {...rest}
        cx={cx()}
        cy={cy()}
        r={PORT_RADIUS * 2}
        class={clsx(styles.portExtended, rest.class)}
        data-kind={props.dataKind}
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
