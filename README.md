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

Aperio 是 Mac 上的文件查看器。文件留在原来的位置，只看，不改。

能看 PDF、图片、文本、代码、Word、Excel、PPT、CSV，以及常见的视频、音频和 zip。不能编辑，不能把文件交给别的应用，也没有 Windows 版。

## 功能

- 把文件拖进窗口就能看。一次拖进多个文件时，按拖入顺序切换。
- 目录列出你打开过的文件夹。可以在网格和列表之间切换。
- 图片可以旋转、翻转和缩放。PDF 可以单页或双页看。文本和代码可以改字号。
- zip 先列出里面有什么，再预览其中的图片、文本和 PDF，也可以解压到你选定的文件夹。
- 「最近打开」只是一份记录。删掉记录不会删掉磁盘上的文件。

| 类型 | 格式 | 说明 |
| --- | --- | --- |
| PDF | `.pdf` | 只查看 |
| 图片 | `.jpg` `.jpeg` `.png` `.gif` `.webp` `.svg` `.heic` `.heif` | HEIC 可以直接看 |
| 文本 | `.md` `.markdown` `.txt` `.html` `.htm` | Markdown 会排成文章 |
| 代码 | `.js` `.jsx` `.mjs` `.cjs` `.ts` `.tsx` `.json` `.py` `.go` `.rs` `.sql` `.yml` `.yaml` `.css` `.sh` `.bash` `.zsh` | 带颜色区分 |
| Office | `.docx` `.xlsx` `.pptx` `.csv` | 只看内容，不还原原来的版式 |
| 影音 | `.mp4` `.mov` `.mp3` | 在应用里播放 |
| 压缩包 | `.zip` | 列出内容，预览其中的图片、文本和 PDF，可解压到选定文件夹 |

表里没写的文件，只要里面是普通文字，也会按文本打开，只是没有颜色区分。

## 安装

这一版还不能下载安装包。要在自己的 Mac 上构建才能打开，步骤写在下面的「开发」里。

## 使用指南

### 打开一个文件

把文件拖进窗口。首页空白的地方都可以放下。一次拖进多个文件时，按拖入顺序查看，用 `←` `→` 切换。

也可以按 `⌘K` 或 `⌘O`，输入文件名再回车打开。没有匹配的文件时，回车会打开系统的选文件窗口，Aperio 自己的搜索不会因此关掉。

打不开的文件会留在原地，并说明原因。旧版 Word、Excel、PPT（`.doc`、`.xls`、`.ppt`），以及 `.tar`、`.gz` 这类压缩包，打不开。

### 首页

首页有两个入口：

- 「浏览目录」进入上次看过的目录，筛选还留着。
- 「最近打开」只看记录。成功打开的 PDF 不会出现在这里。

### 目录

左边「已打开的目录」是你自己打开过的文件夹，不是写死的桌面或下载。按 `⇧⌘O`，或点「打开目录…」，可以再加一个。

单击是选中。双击、回车或空格：文件夹进入下一级，文件则打开。`⌘↑` 回到上一级。已经在最上面时，再退就回首页。

上面可以按类型筛选，也可以搜索。筛选或搜索开着时，会把子文件夹里的文件也列出来，文件夹本身先不显示。网格和列表可以随时换。

在「最近打开」里，选中一条后按 `⌫` 或 `Delete`，只删这条记录。

### 查看

打开之后，`←` `→` 在同一批文件里切换。`Esc` 或空格回到刚才的地方。`I` 看文件信息。`Z` 进入禅模式，再按一次退出。

看图片时可以旋转、翻转和缩放。`⌘L` 向左转，`⌘R` 向右转，`⌘0` 回到最初的大小和方向。看其他文件时，`⌘L` 是打开目录。

看 PDF 时可以单页或左右对开，缩放在 40% 到 200% 之间。看文字时可以改字号，也可以让长行自动折行。看 zip 时，`⌘E` 解压到选定的文件夹。点取消就停住，不会显示成解压失败。

这一版不能分享文件，也不能交给其他应用打开。信息里的「用其他应用打开…」点了也没有反应。

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
| 向左转 / 向右转 | `⌘L` / `⌘R`，仅图片 |
| 放大 / 缩小 | `⌘+` / `⌘−` |
| 回到最初大小 | `⌘0` |
| 解压到… | `⌘E`，仅压缩包 |
| 从最近打开中移除 | `⌫` |

## 限制

- 只支持 Mac。
- 不编辑，不转换格式，不分享，也不交给其他应用打开。
- `.doc`、`.xls`、`.ppt` 打不开。`.tar`、`.gz`、`.tgz`、`.gzip` 打不开。
- 有密码的 zip 打不开。zip 最多列出 2000 项。里面单个文件超过 20MB 时，这一条不能预览，也不能单独取出。压缩包里的 HEIC 打不开。
- 文本超过 2MB 时，不会整份读进来。Word、Excel、PPT、CSV 和 zip 超过 20MB 时，也不会整份打开。
- 成功打开的 PDF 不会记到最近打开。

## 开发

这一节给要自己构建或改代码的人。日常使用可以不看。

仓库在 https://github.com/hidetodong/aperio。

需要：

- Mac
- Node.js `^20.19.0` 或 `>=22.12.0`
- Rust stable
- 要打安装包时，还需要 Xcode 命令行工具

在本机打开：

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

产物在 `src-tauri/target/release/bundle/`。这个包还不能直接发给别人安装。

发版前跑：

```bash
npm run check
```

这条命令会核对版本号和许可证，再跑测试和构建。

单独跑其中一项：

```bash
npm test
npm run build
npm run check:chunks
```

## 项目状态

版本号是 `0.0.1`。

还不能下载安装包。只支持 Mac，不会自动更新，也没有 Windows 版。

## 许可证

[MIT](LICENSE)。版权人是 xingzidong。
