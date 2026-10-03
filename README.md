# Aperio

在 Mac 上查看常见文件。文件留在本机，应用不修改原文件。

界面和安装包的名字是 Aperio。npm 包名和 Rust 包名仍是 `emerge`，Rust 库是 `emerge_lib`。

## 功能

| 类型 | 格式 | 说明 |
| --- | --- | --- |
| PDF | `.pdf` | 只查看 |
| 图片 | `.jpg` `.jpeg` `.png` `.gif` `.webp` `.svg` `.heic` `.heif` | HEIC 由 macOS 解码 |
| 文本 | `.md` `.markdown` `.txt` `.html` `.htm` | Markdown 会渲染 |
| 代码 | `.js` `.jsx` `.mjs` `.cjs` `.ts` `.tsx` `.json` `.py` `.go` `.rs` `.sql` `.yml` `.yaml` `.css` `.sh` `.bash` `.zsh` | 有语法高亮 |
| Office | `.docx` `.xlsx` `.pptx` `.csv` | 只看内容，不还原原版式 |
| 影音 | `.mp4` `.mov` `.mp3` | 在应用里播放 |
| 压缩包 | `.zip` | 列出内容，预览其中的图片、文本和 PDF，可解压到选定目录 |

没列在表里的文件，只要内容是纯文本，也会按文本打开，没有语法高亮。

## 限制

- 只支持 macOS。
- 不编辑，不转换格式，不分享，也不交给其他应用打开。
- `.doc`、`.xls`、`.ppt` 不打开。`.tar`、`.gz`、`.tgz`、`.gzip` 不打开。
- 有密码的 ZIP 不打开。ZIP 只列出前 2000 项。单条超过 20MB 不取出。包里的 HEIC 不解码。
- 文本超过 2MB 不整份读入。Office 和 ZIP 超过 20MB 不整份解析。
- 打开成功的 PDF 不写入最近打开。

## 要求

- macOS
- Node.js `^20.19.0` 或 `>=22.12.0`
- Rust stable
- 打包时需要 Xcode 命令行工具

应用使用 Tauri 2。窗口里是系统自带的 WebKit，不另带浏览器。

## 从源码构建

仓库在 https://github.com/hidetodong/aperio。

```bash
git clone https://github.com/hidetodong/aperio.git
cd aperio
npm install
npm run tauri dev
```

打出本机安装包：

```bash
npm run tauri build
```

产物在 `src-tauri/target/release/bundle/`。

## 开发

发版前跑：

```bash
npm run check
```

这条命令核对三处版本号和许可证，再跑边界检查、测试、前端构建和分块检查。

单独跑其中一项：

```bash
npm test
npm run build
npm run check:chunks
```

## 状态

版本号是 `0.0.1`，写在 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`。

还没有 GitHub Release，也没有发给别人的安装包。

- 仓库是 https://github.com/hidetodong/aperio。
- 推送到仓库后，GitHub Actions 会跑 `npm run check`。
- 推送 `v` 开头的版本标签时，会在 macOS 构建机上打出安装包，挂在该次构建的产物里，不自动创建 Release。这个包没有公证。
- 不做公证、自动更新、网站、Windows 版、收费和插件。

## 许可证

[MIT](LICENSE)。版权人是 xingzidong。
