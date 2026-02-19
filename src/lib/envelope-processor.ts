class EnvelopeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.stage = "idle";
    this.value = 0;
    this.gateOpen = false;
    this.attack = 0.1;
    this.decay = 0.2;
    this.sustain = 0.7;
    this.release = 0.5;
    this.triggerReleaseAtFrame = -1;

    this.port.onmessage = (e) => {
      const d = e.data;
      if (d.type === "params") {
        if (d.attack !== undefined) this.attack = d.attack;
        if (d.decay !== undefined) this.decay = d.decay;
        if (d.sustain !== undefined) this.sustain = d.sustain;
        if (d.release !== undefined) this.release = d.release;
      } else if (d.type === "trigger") {
        this.stage = "attack";
        this.triggerReleaseAtFrame =
          currentFrame + (this.attack + this.decay + 0.1) * sampleRate;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    const output = outputs[0][0];
    const sr = sampleRate;

    for (let i = 0; i < output.length; i++) {
      const gate = input ? input[i] : 0;
      const frame = currentFrame + i;

      // Detect gate transitions (sample-accurate)
      if (gate > 0.5 && !this.gateOpen) {
        this.gateOpen = true;
        this.stage = "attack";
        this.triggerReleaseAtFrame = -1;
      } else if (gate <= 0.5 && this.gateOpen) {
        this.gateOpen = false;
        this.stage = "release";
      }

      // Manual trigger release
      if (
        this.triggerReleaseAtFrame > 0 &&
        frame >= this.triggerReleaseAtFrame
      ) {
        this.triggerReleaseAtFrame = -1;
        this.stage = "release";
      }

      // Compute envelope using exponential curves (matches setTargetAtTime behavior)
      switch (this.stage) {
        case "attack": {
          const tc = Math.max(this.attack / 3, 1 / sr);
          this.value += (1 - this.value) * (1 - Math.exp(-1 / (tc * sr)));
          if (this.value >= 0.999) {
            this.value = 1;
            this.stage = "decay";
          }
          break;
        }
        case "decay": {
          const tc = Math.max(this.decay / 3, 1 / sr);
          this.value +=
            (this.sustain - this.value) * (1 - Math.exp(-1 / (tc * sr)));
          if (Math.abs(this.value - this.sustain) < 0.0001) {
            this.value = this.sustain;
            this.stage = "sustain";
          }
          break;
        }
        case "sustain":
          this.value = this.sustain;
          break;
        case "release": {
          const tc = Math.max(this.release / 3, 1 / sr);
          this.value += (0 - this.value) * (1 - Math.exp(-1 / (tc * sr)));
          if (this.value < 0.0001) {
            this.value = 0;
            this.stage = "idle";
          }
          break;
        }
        case "idle":
          this.value = 0;
          break;
      }

      output[i] = this.value;
    }

    return true;
  }
}

registerProcessor("envelope-processor", EnvelopeProcessor);
