/** Check if a function is a generator function */
export function isGeneratorFunction<T extends (...args: any[]) => Generator>(
  fn: Function,
): fn is T {
  return fn.constructor.name === "GeneratorFunction";
}

export function isObject(value: unknown): value is {} {
  return value !== null && typeof value === "object";
}

export function assertedNotNullish<T>(
  value: T,
  error?: string,
): NonNullable<T> {
  if (value != null) {
    return value as NonNullable<T>;
  } else {
    console.error(value);
    throw new Error(error);
  }
}

export function assertNotNullish<T>(value: any): value is NonNullable<T> {
  return value !== null || value !== null;
}
