import devtools from "solid-devtools/vite";
import { defineConfig, type Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";
import fs from "node:fs";
import path from "node:path";

function autoformatSavePlugin(): Plugin {
  return {
    name: "autoformat-save",
    configureServer(server) {
      server.middlewares.use("/api/save-autoformat", (req, res) => {
        if (req.method !== "POST") {
          res.writeHead(405);
          res.end();
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString();
            const data = JSON.parse(body);
            const filePath = path.resolve("public/autoformat-cases.json");
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.writeHead(500);
            res.end(String(e));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [tsconfigPaths(), devtools(), solidPlugin(), autoformatSavePlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});
