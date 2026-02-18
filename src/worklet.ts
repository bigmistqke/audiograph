/// <reference types="audioworklet" />

import { RPCWorkletProcessor } from "./lib/rpc-worklet-processor";

export class CustomProcessor extends RPCWorkletProcessor<{ volume: number }> {
    props = {
        volume: 0
    }

    hello() {
        console.log('hello')
    }

    process(inputs: Array<Array<Float32Array>>, outputs: Array<Array<Float32Array>>) {
        // By default, the node has single input and output.
        const input = inputs[0];
        const output = outputs[0];

        for (let channel = 0; channel < output.length; ++channel) {
            output[channel].set(input[channel]);
        }

        return true;
    }
}

registerProcessor('custom-processor', CustomProcessor);