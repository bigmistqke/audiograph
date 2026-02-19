import clsx from "clsx";
import { ComponentProps } from "solid-js";
import styles from "./GraphNodeContent.module.css";

export function GraphNodeContent(props: ComponentProps<"div">) {
  return <div {...props} class={clsx(styles.nodeContent, props.style)} />;
}
