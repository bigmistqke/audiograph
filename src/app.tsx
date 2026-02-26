import { Route, Router, useNavigate } from "@solidjs/router";
import { type Component } from "solid-js";
import { AutoformatRoute } from "./routes/autoformat-route";
import { GraphRoute } from "./routes/graph-route";

const App: Component = () => {
  return (
    <Router>
      <Route path="/autoformat" component={AutoformatRoute} />
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
