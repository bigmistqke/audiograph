import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";
import { autoformatSavePlugin } from "./plugins/autoformat-save-plugin";

export default defineConfig({
  plugins: [tsconfigPaths(), devtools(), solidPlugin(), autoformatSavePlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});
