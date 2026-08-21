import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import cfg from "./dashboard.config.json";

const isPagesBuild = process.env.GITHUB_ACTIONS === "true" || process.env.VITE_PAGES === "1";

function serveData(): Plugin {
  const dataRoot = path.resolve("data");
  return {
    name: "serve-data",
    configureServer(server) {
      server.middlewares.use("/data", (req, res, next) => {
        const rel = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\/+/, "");
        const file = path.resolve(dataRoot, rel);
        if (!file.startsWith(dataRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          next();
          return;
        }
        res.setHeader("Content-Type", "application/json");
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveData()],
  base: isPagesBuild ? cfg.pagesBase : "/",
});

