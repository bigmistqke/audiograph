import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, createResource, Show, type Component } from "solid-js";
import { GraphEditor } from "./GraphEditor";
import envelopeProcessorUrl from "./lib/envelope-processor?url";
import sequencerProcessorUrl from "./lib/sequencer-processor?url";

const audioCtx = new AudioContext();
const promise = Promise.all([
  audioCtx.audioWorklet.addModule(envelopeProcessorUrl),
  audioCtx.audioWorklet.addModule(sequencerProcessorUrl),
]);

const App: Component = () => {
  const [resource] = createResource(() => promise.then(() => true));
  const params = useParams<{ graphName?: string }>();
  const navigate = useNavigate();

  createEffect(() => {
    if (!params.graphName) {
      navigate("/default", { replace: true });
    }
  });

  return (
    <Show when={resource() && params.graphName} keyed>
      {(graphName) => <GraphEditor graphName={graphName} context={audioCtx} />}
    </Show>
  );
};

export default App;
