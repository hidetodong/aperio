import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".js")) files.push(path);
  }
}

walk(dist);
const entry = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const entryName = entry.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
if (!entryName) {
  console.error("找不到主包脚本");
  process.exit(1);
}
const entryPath = join(dist, entryName);
const entryText = readFileSync(entryPath, "utf8");
const markers = [
  ["image", /data-viewer["`]?\s*[:=]\s*["'`]image["'`]/],
  ["text", /data-viewer["`]?\s*[:=]\s*["'`]text["'`]/],
  ["pdf", /data-viewer["`]?\s*[:=]\s*["'`]pdf["'`]/],
  ["office", /data-viewer["`]?\s*[:=]\s*["'`]office["'`]/],
];
for (const [name, marker] of markers) {
  if (marker.test(entryText)) {
    console.error(`主包里出现了查看器标记：${name}`);
    process.exit(1);
  }
  const hit = files.some((file) => file !== entryPath && marker.test(readFileSync(file, "utf8")));
  if (!hit) {
    console.error(`没有独立的查看器包包含 ${name}`);
    process.exit(1);
  }
}
const pdfLib = /pdfjs-dist|pdf\.worker|GlobalWorkerOptions/;
if (pdfLib.test(entryText)) {
  console.error("主包里出现了 pdf.js");
  process.exit(1);
}
const libHit = files.some((file) => file !== entryPath && pdfLib.test(readFileSync(file, "utf8")));
if (!libHit) {
  console.error("没有独立的包包含 pdf.js");
  process.exit(1);
}
const officeLib = /JSZip|sheet_to_json|SheetJS/;
if (officeLib.test(entryText)) {
  console.error("主包里出现了 Office 解析库");
  process.exit(1);
}
const officeHit = files.some((file) => file !== entryPath && officeLib.test(readFileSync(file, "utf8")));
if (!officeHit) {
  console.error("没有独立的包包含 Office 解析库");
  process.exit(1);
}
console.log(`主包与查看器已分开，共 ${files.length} 个脚本`);
