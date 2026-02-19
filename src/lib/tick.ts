const subscribers = new Set<() => void>();
let rafId: number | undefined;

function loop() {
  for (const cb of subscribers) cb();
  rafId = requestAnimationFrame(loop);
}

export function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  if (subscribers.size === 1) rafId = requestAnimationFrame(loop);
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0 && rafId !== undefined) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }
  };
}
