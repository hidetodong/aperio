# Project Type
- 桌面应用。仓库目前是空的，还没有源码
- 定下来的形态：Mac 上自己用的本地文件阅读器，给人看的名字是「浮现」，英文 Emerge
- 壳用 Tauri 2，也就是用 Rust 包一层系统自带的网页视图，不把浏览器打进安装包。界面用 TypeScript、React、Vite。Rust 只做打开文件、读字节、用系统能力解 HEIC

# Local Constraints
- 机器配置里的技术画像先空着。原因：空仓库对不上任何画像；等 TypeScript 源码落地，再考虑打开 typescript-rules，不提前开
- 这里说的插件，只是按格式家族懒加载，再加一份启用名单。原因：要的是启动时少加载，不是插件市场，也不做插件之间的隔离
- 只给自己在 Mac 上用，不对外发安装包。原因：不做公证、收款、试用锁、自动更新、Windows 和网站
- 不打包 Chrome，也不打包中文字体，用系统字体。原因：内存和体积的大头在这里

# External References
- https://xiaoeromia.com/ ：对照过的阅读器 Omia，只作背景，不是要逐条实现的规格
