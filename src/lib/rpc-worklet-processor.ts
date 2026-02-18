
import { expose } from "@bigmistqke/rpc/messenger";

export abstract class RPCWorkletProcessor<T extends Record<string, any> = Record<string, any>> extends AudioWorkletProcessor {
    abstract props: T

    constructor() {
        super()
        expose(this, { to: this.port })
    }

    set<U extends keyof T>(key: U, value: T[U]) {
        this.props[key] = value
    }
}