import clsx from "clsx";
import styles from "./HorizontalSlider.module.css";

export function HorizontalSlider(props: {
  value: number;
  title: string;
  output: string;
  disabled?: boolean;
  onInput: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div class={clsx(styles.container, props.disabled && styles.disabled)}>
      <label class={styles.label}>
        <span>{props.title}</span>
        <output class={styles.output}>{props.output}</output>
      </label>
      <input
        type="range"
        class={styles.slider}
        data-pointerevents-block={!props.disabled}
        min={props.min ?? 20}
        max={props.max ?? 2000}
        step={props.step}
        value={props.value}
        disabled={props.disabled}
        onInput={(e) => props.onInput(+e.currentTarget.value)}
      />
    </div>
  );
}
