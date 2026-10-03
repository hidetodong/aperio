// pdf.js 6 会用到系统网页视图还没有的全局能力。
// 这个文件不能 import 别的模块：后台解析脚本会把原文接在库文件前面。

export function installIterator(host) {
  if (typeof host.Iterator === "function") return;
  host.Iterator = class Iterator {};
}

export function installMapUpsert(proto) {
  if (typeof proto.getOrInsert !== "function") {
    proto.getOrInsert = function (key, value) {
      if (this.has(key)) return this.get(key);
      this.set(key, value);
      return value;
    };
  }
  if (typeof proto.getOrInsertComputed !== "function") {
    proto.getOrInsertComputed = function (key, callback) {
      if (this.has(key)) return this.get(key);
      const value = callback(key);
      this.set(key, value);
      return value;
    };
  }
}

export function installPromiseTry(ctor) {
  if (typeof ctor.try === "function") return;
  ctor.try = (fn, ...args) => new Promise((resolve) => resolve(fn(...args)));
}

export function installBase64(proto, ctor) {
  if (typeof proto.toBase64 !== "function") {
    proto.toBase64 = function () {
      const block = 8192;
      let binary = "";
      for (let i = 0; i < this.length; i += block) {
        const codes = [];
        const end = Math.min(i + block, this.length);
        for (let j = i; j < end; j++) codes.push(this[j]);
        binary += String.fromCharCode(...codes);
      }
      return btoa(binary);
    };
  }
  if (typeof ctor.fromBase64 !== "function") {
    ctor.fromBase64 = (input) => {
      const binary = atob(input);
      const out = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
      return out;
    };
  }
}

export function ensurePdfRuntime() {
  installIterator(globalThis);
  installMapUpsert(Map.prototype);
  installPromiseTry(Promise);
  installBase64(Uint8Array.prototype, Uint8Array);
}

ensurePdfRuntime();
