import { Route, Router, useNavigate, useParams } from "@solidjs/router";
import { createEffect, type Component } from "solid-js";
import { GraphRoute } from "./routes/graph-route";

const App: Component = () => {
  const params = useParams<{ graphName?: string }>();
  const navigate = useNavigate();

  createEffect(() => {
    if (!params.graphName) {
      navigate("/default", { replace: true });
    }
  });

  return (
    <Router>
      <Route path="/:id" component={GraphRoute} />
    </Router>
  );
};

export default App;
