import clsx from "clsx";
import { ComponentProps } from "solid-js";
import styles from "./node-content.module.css";

export function GraphNodeContent(
  props: ComponentProps<"div"> & { disabled?: boolean },
) {
  return (
    <div
      {...props}
      aria-disabled={props.disabled}
      class={clsx(
        styles.nodeContent,
        props.disabled && styles.disabled,
        props.style,
      )}
    />
  );
}
