export function HorizontalSlider(props: {
  value: number;
  title: string;
  output: string;
  disabled?: boolean;
  onInput: (value: number) => void;
}) {
  return (
    <>
      <label
        style={{
          "font-size": "10px",
          color: "black",
          display: "flex",
          "justify-content": "space-between",
        }}
      >
        <span>{props.title}</span>
        <output>{props.output}</output>
      </label>

      <input
        type="range"
        min={20}
        max={2000}
        value={props.value}
        disabled={props.disabled}
        onInput={(e) => props.onInput(+e.currentTarget.value)}
        style={{ width: "100%", "margin-inline": 0 }}
      />
    </>
  );
}
