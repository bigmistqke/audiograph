import { createComputed, mapArray } from "solid-js";
import { createStore } from "solid-js/store";

export function createProjection<T>(
  store: T[],
  map: (value: T, key: number) => void,
) {
  const [projection, setProjection] = createStore([]);

  createComputed(
    mapArray(
      () => store,
      (value, index) => {
        createComputed(() => setProjection(index(), map(value, index())));
      },
    ),
  );

  return projection;
}
