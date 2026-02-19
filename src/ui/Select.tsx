import { For } from "solid-js";

export function Select<T extends string>(props: {
  value: T;
  title: string;
  options: readonly T[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <>
      <label
        style={{
          "font-size": "10px",
          color: "var(--color-text)",
          display: "flex",
          "justify-content": "space-between",
          "align-items": "center",
          "padding-bottom": "5px",
        }}
      >
        <span>{props.title}</span>
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
      </label>
    </>
  );
}
