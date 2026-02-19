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
    <>
      <label
        style={{
          "font-size": "10px",
          color: "var(--color-text)",
          display: "flex",
          "justify-content": "space-between",
        }}
      >
        <span>{props.title}</span>
        <output>{props.output}</output>
      </label>
      <input
        type="range"
        data-pointerevents-block={!props.disabled}
        min={props.min ?? 20}
        max={props.max ?? 2000}
        step={props.step}
        value={props.value}
        disabled={props.disabled}
        onInput={(e) => props.onInput(+e.currentTarget.value)}
        style={{ width: "100%", "margin-inline": 0 }}
      />
    </>
  );
}
