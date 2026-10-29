import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { chmod, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import os from "node:os";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const dest = path.join(root, "src-tauri", "resources", "ffmpeg");
const stamp = path.join(root, "src-tauri", "resources", "ffmpeg.sha256");
const source = "https://ffmpeg.martin-riedl.de/download/macos/arm64/1785863997_9.0/ffmpeg.zip";
const zipSha = "5267ef149ee0d208057a1b316aac079b661b0476574dee5da7d225769773c603";

if (process.platform !== "darwin" || process.arch !== "arm64") {
  console.error("这一份播放组件只提供给 Apple 芯片的 Mac");
  process.exit(1);
}

const marked = await readFile(stamp, "utf8").catch(() => "");
if (marked.trim() === zipSha) {
  const existing = await readFile(dest).catch(() => null);
  if (existing && existing.byteLength > 0) {
    console.log("播放组件已在，跳过下载");
    process.exit(0);
  }
}

const tmp = await os.tmpdir();
const work = path.join(tmp, `aperio-ffmpeg-${process.pid}`);
await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });
const zipPath = path.join(work, "ffmpeg.zip");
const response = await fetch(source);
if (!response.ok || !response.body) {
  console.error("播放组件下载失败");
  process.exit(1);
}
await pipeline(response.body, createWriteStream(zipPath));
const hash = createHash("sha256").update(await readFile(zipPath)).digest("hex");
if (hash !== zipSha) {
  console.error("播放组件校验和不符");
  process.exit(1);
}
await exec("unzip", ["-o", zipPath, "-d", work]);
await mkdir(path.dirname(dest), { recursive: true });
await rm(dest, { force: true });
await rename(path.join(work, "ffmpeg"), dest);
await chmod(dest, 0o755);
await exec("xattr", ["-d", "com.apple.quarantine", dest]).catch(() => undefined);
await writeFile(stamp, `${zipSha}\n`);
await rm(work, { recursive: true, force: true });
console.log("播放组件已就绪");
