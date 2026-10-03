import { readFileSync } from "node:fs";

function fail(message) {
  console.error(message);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const conf = JSON.parse(readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const cargo = readFileSync(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8");
const cargoLock = readFileSync(new URL("../src-tauri/Cargo.lock", import.meta.url), "utf8");
const cargoVersion = cargo.match(/^version = "([^"]+)"/m)?.[1];
const cargoLockVersion = cargoLock.match(/name = "emerge"\nversion = "([^"]+)"/)?.[1];
const license = readFileSync(new URL("../LICENSE", import.meta.url), "utf8");
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

const versions = {
  "package.json": pkg.version,
  "package-lock.json": lock.version,
  "package-lock packages": lock.packages?.[""]?.version,
  "tauri.conf.json": conf.version,
  "Cargo.toml": cargoVersion,
  "Cargo.lock": cargoLockVersion,
};
const mismatched = Object.entries(versions).filter(([, version]) => version !== "0.0.1");
if (mismatched.length > 0) {
  fail(`版本号不一致：${mismatched.map(([name, version]) => `${name}=${version}`).join("，")}`);
}
if ("private" in pkg) {
  fail("package.json 还标着 private");
}
if (!license.startsWith("MIT License\n") || !license.includes("Copyright (c) 2026 xingzidong")) {
  fail("LICENSE 不是这一版约定的 MIT 正文");
}
if (!readme.includes("npm run check") || !readme.includes("[MIT](LICENSE)") || !readme.includes("版本号是 `0.0.1`")) {
  fail("README 没有写上 0.0.1、许可证或发版检查");
}
if (!readme.includes("https://github.com/hidetodong/aperio")) {
  fail("README 没有写上仓库地址");
}
if (readme.includes("0.1.0") || readme.includes("远程还没加上") || readme.includes("这个地址现在不存在") || readme.includes("仓库还没有远程")) {
  fail("README 还写着旧版本号，或仍写远程不存在");
}

console.log("版本号 0.0.1，许可证文件在。");
