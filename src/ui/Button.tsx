import { ComponentProps } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";

export function Button(
  props: Omit<ComponentProps<"button">, "style"> & {
    style?: JSX.CSSProperties;
  },
) {
  return (
    <button
      {...props}
      style={{ height: "var(--element-height)", ...props.style }}
    />
  );
}
