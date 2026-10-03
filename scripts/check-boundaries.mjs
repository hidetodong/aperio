import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const cargo = readFileSync(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8");
const pkgBlob = JSON.stringify(pkg).toLowerCase();
if (pkgBlob.includes("electron")) {
  console.error("依赖里不该出现 electron");
  process.exit(1);
}
for (const name of ["pdfjs", "jszip", "xlsx"]) {
  if (!pkgBlob.includes(name)) {
    console.error(`前端依赖里应该有 ${name}`);
    process.exit(1);
  }
}
if (/pdfjs|pdf|lopdf|docx|calamine/i.test(cargo)) {
  console.error("Rust 依赖里出现了格式解析库");
  process.exit(1);
}
if (/^(zip|flate2|tar|mp4parse|symphonia|rodio)\s*=/m.test(cargo)) {
  console.error("Rust 依赖里出现了压缩或影音解析库");
  process.exit(1);
}
const zipReader = readFileSync(new URL("../src/formats/zip/readZip.ts", import.meta.url), "utf8");
if (/pdfjs|PdfView|ImageView|formats\/pdf|formats\/image/.test(zipReader)) {
  console.error("压缩包读取代码引用了 PDF 或图片查看器");
  process.exit(1);
}
const mediaView = readFileSync(new URL("../src/formats/media/MediaView.tsx", import.meta.url), "utf8");
if (/jszip|JSZip|pdfjs/.test(mediaView)) {
  console.error("影音查看器不该带解析库");
  process.exit(1);
}

function walk(dir, hit) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "target" || name === "dist" || name === ".git") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, hit);
    else if (/\.(ttf|otf|woff2?)$/i.test(name)) hit.push(path);
  }
}

const fonts = [];
walk(root, fonts);
if (fonts.length) {
  console.error(`仓库里打进了字体：${fonts.join(", ")}`);
  process.exit(1);
}
console.log("依赖和字体边界通过");
