import { Route, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import { App } from "./app";

render(
  () => (
    <Router root={App}>
      <Route path="/:id" component={() => null} />
      <Route path="*" component={() => null} />
    </Router>
  ),
  document.getElementById("root")!,
);
