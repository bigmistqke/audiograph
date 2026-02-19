import clsx from "clsx";
import type { ComponentProps, JSX } from "solid-js";
import styles from "./Button.module.css";

export function Button(
  props: Omit<ComponentProps<"button">, "style"> & {
    style?: JSX.CSSProperties;
  },
) {
  return (
    <button
      {...props}
      class={clsx(props.class, styles.button)}
      style={{ height: "var(--element-height)", ...props.style }}
    />
  );
}
