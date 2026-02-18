import type { RPC } from "@bigmistqke/rpc/messenger";
import { rpc } from "@bigmistqke/rpc/messenger";

export class RPCAudioWorkletNode<
  T extends { port: MessagePort },
> extends AudioWorkletNode {
  rpc: RPC<T>;
  constructor(context: AudioContext, id: string) {
    super(context, id);
    this.rpc = rpc<T>(this.port);
  }
}
