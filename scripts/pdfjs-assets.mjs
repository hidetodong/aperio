import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, normalize, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../node_modules/pdfjs-dist/", import.meta.url));
const preludeFile = fileURLToPath(new URL("../src/formats/pdf/pdfPrelude.js", import.meta.url));
const workerFile = join(packageRoot, "build/pdf.worker.min.mjs");
const workerUrl = "/pdfjs/pdf.worker.mjs";
const dirs = ["cmaps", "standard_fonts", "wasm", "iccs"];

function workerSource() {
  return `${readFileSync(preludeFile, "utf8")}\n${readFileSync(workerFile, "utf8")}`;
}

function contentType(name) {
  if (name.endsWith(".wasm")) return "application/wasm";
  if (name.endsWith(".js")) return "text/javascript";
  if (name.endsWith(".ttf")) return "font/ttf";
  return "application/octet-stream";
}

function filesIn(dir) {
  if (!existsSync(dir)) return [];
  const found = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...filesIn(path));
    else found.push(path);
  }
  return found;
}

export function pdfjsAssets() {
  return {
    name: "pdfjs-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (url === workerUrl) {
          res.setHeader("Content-Type", "text/javascript");
          res.setHeader("Cache-Control", "no-cache");
          res.end(workerSource());
          return;
        }
        const dir = dirs.find((name) => url.startsWith(`/pdfjs/${name}/`));
        if (!dir) return next();
        let rel = "";
        try {
          rel = decodeURIComponent(url.slice(`/pdfjs/${dir}/`.length));
        } catch {
          return next();
        }
        if (!rel || rel.includes("..")) return next();
        const root = join(packageRoot, dir);
        const file = normalize(join(root, rel));
        if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader("Content-Type", contentType(file));
        const stream = createReadStream(file);
        stream.on("error", () => {
          if (!res.headersSent) res.statusCode = 404;
          res.end();
        });
        stream.pipe(res);
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "pdfjs/pdf.worker.mjs",
        source: workerSource(),
      });
      for (const dir of dirs) {
        const base = join(packageRoot, dir);
        for (const file of filesIn(base)) {
          const rel = relative(base, file).split(sep).join("/");
          this.emitFile({
            type: "asset",
            fileName: `pdfjs/${dir}/${rel}`,
            source: readFileSync(file),
          });
        }
      }
    },
  };
}
