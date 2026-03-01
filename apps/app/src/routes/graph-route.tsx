import { useNavigate, useParams } from "@solidjs/router";
import { AudioGraphEditor } from "~/audio-graph-editor/audio-graph-editor";

export function GraphRoute() {
  const params = useParams();
  const navigate = useNavigate();
  return (
    <AudioGraphEditor
      id={params.id ?? ""}
      onOpenProject={(id) => navigate(`/${id}`)}
    />
  );
}
