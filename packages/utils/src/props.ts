import { splitProps } from "solid-js";

export function pickProps<T extends object, TKeys extends Array<keyof T>>(
  value: T,
  keys: TKeys,
) {
  return splitProps(value, keys)[0];
}

export function omitProps<T extends object, TKeys extends Array<keyof T>>(
  value: T,
  keys: TKeys,
) {
  return splitProps(value, keys)[1];
}
