export function wait(time: number = 1_000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
