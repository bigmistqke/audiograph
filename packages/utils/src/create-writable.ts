import { createComputed, createMemo, createSignal } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

export function createWritable<T>(fn: () => T) {
  const signal = createMemo(() => createSignal(fn()));
  const get = () => signal()[0]();
  const set = (v: any) => signal()[1](v);
  return [get, set] as ReturnType<typeof createSignal<T>>;
}

export function createWritableStore<T extends object>(fn: () => T) {
  const [store, setStore] = createStore(fn());
  createComputed(() => setStore(reconcile(fn())));
  return [store, setStore] as const;
}
