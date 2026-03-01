import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { autoformatSavePlugin } from "./plugins/autoformat-save-plugin";

export default defineConfig({
  plugins: [solidPlugin(), autoformatSavePlugin()],
  server: {
    port: 3001,
  },
  build: {
    target: "esnext",
  },
});
