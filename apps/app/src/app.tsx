import { Route, Router, useNavigate } from "@solidjs/router";
import { type Component } from "solid-js";
import { BASE } from "./constants.ts";
import { GraphRoute } from "./routes/graph-route.tsx";

const App: Component = () => {
  return (
    <Router base={BASE}>
      <Route path="/:id" component={GraphRoute} />
      <Route
        path="/"
        component={() => {
          useNavigate()("default");
          return null!;
        }}
      />
    </Router>
  );
};

export default App;
