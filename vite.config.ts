import devtools from "solid-devtools/vite";
import { defineConfig, type Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";
import fs from "node:fs";
import path from "node:path";

function autoformatSavePlugin(): Plugin {
  const dir = path.resolve("public/autoformat-cases");
  const oldFile = path.resolve("public/autoformat-cases.json");

  function migrate() {
    if (!fs.existsSync(oldFile) || fs.existsSync(path.join(dir, "index.json")))
      return;
    const old = JSON.parse(fs.readFileSync(oldFile, "utf-8"));
    const cases: any[] = (old.cases ?? []).map((c: any) => ({
      id: c.id,
      comments: c.description
        ? [{ role: "user", text: c.description }]
        : [],
      initial: c.initial,
      expected: c.expected,
    }));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    for (const c of cases) {
      fs.writeFileSync(
        path.join(dir, `${c.id}.json`),
        JSON.stringify(c, null, 2),
      );
    }
    fs.writeFileSync(
      path.join(dir, "index.json"),
      JSON.stringify(cases.map((c) => c.id), null, 2),
    );
  }

  return {
    name: "autoformat-save",
    configureServer(server) {
      migrate();

      server.middlewares.use("/api/autoformat-cases", (req, res) => {
        if (req.method !== "GET") {
          res.writeHead(405);
          res.end();
          return;
        }
        try {
          const indexPath = path.join(dir, "index.json");
          if (!fs.existsSync(indexPath)) {
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify([]));
            return;
          }
          const ids: string[] = JSON.parse(
            fs.readFileSync(indexPath, "utf-8"),
          );
          const cases = ids
            .filter((id) => fs.existsSync(path.join(dir, `${id}.json`)))
            .map((id) =>
              JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), "utf-8")),
            );
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(cases));
        } catch (e) {
          res.writeHead(500);
          res.end(String(e));
        }
      });

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
            const { cases } = JSON.parse(Buffer.concat(chunks).toString());
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            for (const c of cases) {
              fs.writeFileSync(
                path.join(dir, `${c.id}.json`),
                JSON.stringify(c, null, 2),
              );
            }
            fs.writeFileSync(
              path.join(dir, "index.json"),
              JSON.stringify(cases.map((c: any) => c.id), null, 2),
            );
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
