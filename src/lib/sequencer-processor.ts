// AudioWorklet processor for step sequencer.
// Generates gate signal at sample rate — no main thread timing dependency.

class SequencerProcessor extends AudioWorkletProcessor {
  bpm = 120;
  steps = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
  playing = false;
  samplePos = 0;
  currentStep = -1;
  // 1ms retrigger gap in samples (recalculated on sampleRate)
  retriggerSamples = Math.ceil(sampleRate * 0.001);

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent) => {
      const d = e.data;
      switch (d.type) {
        case "start":
          this.playing = true;
          this.samplePos = 0;
          this.currentStep = -1;
          break;
        case "stop":
          this.playing = false;
          this.currentStep = -1;
          this.port.postMessage({ type: "step", value: -1 });
          break;
        case "bpm":
          this.bpm = d.value;
          break;
        case "steps":
          this.steps = d.value;
          break;
      }
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]) {
    const output = outputs[0][0];

    if (!this.playing) {
      output.fill(0);
      return true;
    }

    const stepCount = this.steps.length;
    const samplesPerStep = (60 / this.bpm / 4) * sampleRate;

    for (let i = 0; i < output.length; i++) {
      const step = Math.floor(this.samplePos / samplesPerStep) % stepCount;

      // Report step changes to main thread for UI
      if (step !== this.currentStep) {
        this.currentStep = step;
        this.port.postMessage({ type: "step", value: step });
      }

      const posInStep = this.samplePos % samplesPerStep;
      const isActive = this.steps[step];

      // Brief gate-off at start of each step for retrigger
      output[i] = isActive && posInStep >= this.retriggerSamples ? 1 : 0;

      this.samplePos++;
    }

    return true;
  }
}

registerProcessor("sequencer-processor", SequencerProcessor);
