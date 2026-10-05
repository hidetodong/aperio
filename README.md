<p align="center">
  <img src="docs/aperio-logo.svg" width="96" height="96" alt="Aperio">
</p>

<h1 align="center">Aperio</h1>

<p align="center">在 Mac 上查看常见文件。文件留在本机，应用不修改原文件。</p>

<p align="center">
  <a href="https://github.com/hidetodong/aperio/actions/workflows/check.yml"><img alt="检查" src="https://github.com/hidetodong/aperio/actions/workflows/check.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <img alt="macOS" src="https://img.shields.io/badge/platform-macOS-black">
  <img alt="0.0.1" src="https://img.shields.io/badge/version-0.0.1-blue">
</p>

<p align="center">
  <a href="#简介">简介</a> ·
  <a href="#功能">功能</a> ·
  <a href="#安装">安装</a> ·
  <a href="#使用指南">使用指南</a> ·
  <a href="#开发">开发</a>
</p>

## 简介

Aperio 是 macOS 上的本地文件查看器。窗口用的是系统自带的 WebKit，不另带浏览器。文件留在原来的位置，应用只读，不改原件。

日常能看的是 PDF、图片、文本和代码、Word、Excel、PPT、CSV、mp4、mov、mp3，以及 zip。不能编辑，不能转换格式，也没有 Windows 版。

界面和安装包的名字是 Aperio。npm 包名和 Rust 包名仍是 `emerge`，Rust 库是 `emerge_lib`。

## 功能

- 把文件拖进窗口就能看。一次拖进多个文件时，按拖入顺序切换。
- 目录列出你打开过的文件夹。网格和列表可以换。
- 图片可以旋转、翻转和缩放。PDF 可以单页或双页。文本和代码可以改字号。
- zip 先列出内容，再预览里面的图片、文本和 PDF，也可以解压到选定目录。
- 最近打开只记记录，不删磁盘上的文件。

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

## 安装

目前没有可下载的安装包。在自己的 Mac 上从源码构建。仓库在 https://github.com/hidetodong/aperio。

### 要求

- macOS
- Node.js `^20.19.0` 或 `>=22.12.0`
- Rust stable
- 打包时需要 Xcode 命令行工具

应用使用 Tauri 2。

### 从源码运行

```bash
git clone https://github.com/hidetodong/aperio.git
cd aperio
npm install
npm run tauri dev
```

### 打出本机安装包

```bash
npm run tauri build
```

产物在 `src-tauri/target/release/bundle/`。这个包没有公证。

## 使用指南

### 打开一个文件

把文件拖进窗口。首页任意空白处都可以放下。一次拖进多个文件时，按拖入顺序查看，用 `←` `→` 切换。

也可以按 `⌘K` 或 `⌘O` 按文件名搜索，再回车打开。搜索没有命中时，回车会改用系统的文件选择框，选择框本身不关。

打不开的文件会停在原地，并写出原因。`.doc`、`.xls`、`.ppt`，以及 `.tar`、`.gz`、`.tgz`、`.gzip`，直接拒绝。

### 首页

首页有两个入口：

- 「浏览目录」进入目录，并保留上一次的筛选。
- 「最近打开」只看打开记录。成功打开的 PDF 不会出现在这里。

### 目录

侧栏「已打开的目录」是你打开过的真实目录，不是预设的桌面或下载文件夹。`⇧⌘O`，或侧栏里的「打开目录…」，用来再加一个目录。

单击选中。双击、回车或空格：文件夹进入下一级，文件打开。`⌘↑` 回到上一级。已经在该目录的根上时，返回首页。

顶部可以按类型筛选，也可以搜索。筛选或搜索开着时，结果包含子文件夹里的文件，文件夹卡片先隐藏。网格和列表可以随时换。

在「最近打开」里，选中一条记录后按 `⌫` 或 `Delete`，只删这条记录。

### 查看

打开之后，`←` `→` 在同一批文件里切换。`Esc` 或空格返回来的地方。`I` 打开文件信息。`Z` 进入禅模式，再按一次退出。

看图片时可以旋转、翻转和缩放。`⌘L` 向左旋转，`⌘R` 向右旋转，`⌘0` 回到原来的缩放、旋转和翻转。看其他文件时，`⌘L` 仍然是打开目录。

看 PDF 时可以单页或双页，缩放范围是 40% 到 200%。看文本时可以改字号和换行。看压缩包时，`⌘E` 解压到选定的目录。取消选择目录不会被当成解压失败。

这一版不分享文件，也不交给其他应用打开。查看器里的「用其他应用打开…」同样不起作用。

### 快捷键

| 动作 | 按键 |
| --- | --- |
| 打开文件 | `⌘K` 或 `⌘O` |
| 打开目录 | `⇧⌘O` |
| 进入目录 | `⌘L` |
| 设置 | `⌘,` |
| 上一级 | `⌘↑` |
| 上一个 / 下一个 | `←` `→` |
| 返回 | `Esc` |
| 文件信息 | `I` |
| 禅模式 | `Z` |
| 向左旋转 / 向右旋转 | `⌘L` / `⌘R`，仅图片 |
| 放大 / 缩小 | `⌘+` / `⌘−` |
| 重置缩放 | `⌘0` |
| 解压到… | `⌘E`，仅压缩包 |
| 从最近打开中移除 | `⌫` |

## 限制

- 只支持 macOS。
- 不编辑，不转换格式，不分享，也不交给其他应用打开。
- `.doc`、`.xls`、`.ppt` 不打开。`.tar`、`.gz`、`.tgz`、`.gzip` 不打开。
- 有密码的 ZIP 不打开。ZIP 只列出前 2000 项。单条超过 20MB 不取出。包里的 HEIC 不解码。
- 文本超过 2MB 不整份读入。Office 和 ZIP 超过 20MB 不整份解析。
- 打开成功的 PDF 不写入最近打开。

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

推送到仓库后，GitHub Actions 会跑同一条 `npm run check`。推送 `v` 开头的版本标签时，会在 macOS 构建机上打出安装包，挂在该次构建的产物里，不自动创建 Release。

## 项目状态

版本号是 `0.0.1`，写在 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`。

还没有 GitHub Release，也没有发给别人的安装包。不做公证、自动更新、网站、Windows 版、收费和插件。

## 许可证

[MIT](LICENSE)。版权人是 xingzidong。
