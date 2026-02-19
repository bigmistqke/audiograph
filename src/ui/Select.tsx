import { For } from "solid-js";
import styles from "./Select.module.css";

export function Select<T extends string>(props: {
  value: T;
  title: string;
  options: readonly T[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <>
      <div class={styles.container}>
        <label class={styles.label}>{props.title}</label>
        <select
          value={props.value}
          disabled={props.disabled}
          onChange={(e) => props.onChange(e.currentTarget.value as T)}
          style={{
            "font-size": "10px",
            "font-family": "inherit",
            border: "1px solid var(--color-stroke)",
            background: "white",
            color: "var(--color-text)",
          }}
        >
          <For each={props.options}>
            {(option) => <option value={option}>{option}</option>}
          </For>
        </select>
      </div>
    </>
  );
}
