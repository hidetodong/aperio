<!-- butler-artifact-template: 1.0.0 artifact=tech_plan -->
# TECH_PLAN — ITER-0004

方案状态: pass
方案审查日期: 2026-09-29
方案审查方式: dangerous-self-review

> ⚠️ 危险模式：本产物由模型自主 ACK（已过 §5 自审门），未经用户确认（ITER-0004，2026-09-29）

## Design Decisions

- 目标只支撑 AC1 到 AC5。不打开压缩包和影音，不改 PDF 的最近列表。
- Word 和 PPT 用 JSZip 读包里的 XML，只取文字。Excel 用 SheetJS 读单元格已经存好的文字，不自己计算公式。CSV 自己解析。被放弃的做法是在 Rust 里加解析库，因为格式解析约定留在前端。
- 查看器做成单独一块，用到才加载。打开 CSV 时不顺带加载 Excel 的库，打开 Word 时不顺带加载 Excel 的库。启用名单把 office 打开。
- 文件字节由页面通过已经允许的地址去取，不新增 Rust 读全文件的命令。
- 旧的 doc、xls、ppt 在打开时直接给出说明，不下载、不拆包。
- 表格超过 2000 行就停，并写明后面还有。超过 20MB 不解析。被放弃的做法是把整张大表一次画完。
- 成功的 Office 进入最近列表。失败不进。PDF 仍保持成功不进最近列表。
- 画面用文本节点，不用文档里的 HTML。不编辑。

### 文件与模块

- `src/formats/enable.ts`：打开 office。
- `src/formats/load.ts`：office 查看器按需加载。
- `src/formats/office/`：CSV、docx、xlsx、pptx 的解析和画面。
- `src/open/openFile.ts`：Office 成功时交出地址；旧格式直接说明；失败走现有错误结果。
- `src/open/session.ts`：当前内容可以是 Office，成功时进入最近列表。
- `scripts/check-chunks.mjs`：主包里不许出现 Office 解析库。
- `scripts/check-boundaries.mjs`：允许前端依赖 JSZip 和 SheetJS，继续禁止 Rust 解析 Office。

### 接口

- 打开结果增加一种 Office 当前内容，只带路径、名字和地址。解析出的文字由查看器自己持有，换文件时随画面丢掉。
- 解析函数接受字节，测试不依赖真窗口。

### 边界

- Rust 依赖不增加 Office 库。
- 不改 PDF 只画看得到的页，也不改 PDF 不进最近列表。
- 不改图片和文本的查看方式。

### Plan Admission

- AC Coverage：AC1 到 AC5 都有单测或构建后检查。
- Assumptions：JSZip 能读 docx 和 pptx 里的 XML。SheetJS 能在页面里读 xlsx，并且不执行单元格公式。这个假设若实现时不成立，就退回改方案，不用「把文件当纯文本显示」绕过去。
- Alternatives / Trade-offs：见上面被放弃的做法。没有把压缩包并进来，也没有重开 PDF 那一段。
- Failure Modes：文件不在、内容坏了、旧格式、超过 20MB、超过 2000 行、加密或解析失败。前三个和超大走错误或说明，不进最近列表。超行数仍算打开成功，但写明被截断。
- Impact / Scope Challenge：改动停在启用名单、打开结果、Office 查看器和两条检查脚本。更小的做法是只做 CSV，但路线这一项写的是 Word、Excel、CSV、PPT 一起预览。
- Verification Blind Spots：单测用最小文件，不能证明真窗口里大表顺手，也不能证明版面和 Office 一样。这两件不写成自动通过线。
- Verdict：pass。没有必须先改方案才能写的问题。

### Execution Steps

- [x] T1 启用名单打开 office，加载函数只在打开时存在 → AC1
- [x] T2 打开结果能表示 Office，旧格式直接说明，失败不进最近列表，成功要进 → AC4 AC5
- [x] T3 解析 CSV、docx、xlsx、pptx，超行数和超大有说明 → AC3 AC4
- [x] T4 分包和依赖边界允许单独的 Office 块，仍禁止 Rust 解析 → AC2

## Failure Paths

- 文件不在：显示找不到，不进最近列表，画面不留上一份。
- 旧的 doc、xls、ppt：显示先不看，不读内容。
- 内容坏了或解析失败：显示原因。不弹密码框。
- 超过 20MB：显示太大，不解析。
- 超过 2000 行：显示前 2000 行，并说明后面还有。
- 换文件：上一份正文不留。

## Test Strategy

- 前端单测覆盖启用名单、旧格式、失败结果、最近列表、四种最小文件和超限。
- 构建后跑分包检查和依赖边界检查。
- 不把真窗口里的观感写成通过条件。

## References Compliance

- N/A
