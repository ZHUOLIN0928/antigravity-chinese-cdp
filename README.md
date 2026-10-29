# Antigravity Chinese CDP (antigravity-chinese-cdp)

基于 Chrome DevTools Protocol (CDP) 运行期内存注入的 Google Antigravity 中文本地化与自适应退避自愈套件。

---

## 机制特点

1. **零文件修改与完整签名保留**：
   - 不修改或替换客户端的 `app.asar` 文件。
   - 保留 Google 官方二进制数字签名，在 macOS 下不会因代码签名变动而触发钥匙串（Safe Storage）访问授权弹窗。
2. **Chromium 原生 DevToolsActivePort 底层探测**：
   - 重构端口发现机制，优先通过 Chromium 原生 `DevToolsActivePort` 规范读取调试端口，零子进程开销，彻底解决 Windows / Linux 跨平台兼容难题与路径依赖。
   - 保留 `tasklist` / `netstat` / `ps` / `lsof` 作为健壮的双重 Fallback 机制。
3. **功耗敏感型自适应退避守护**：
   - 注入成功且页面处于稳定健康状态时，自动将检测周期从 2 秒拉长至 12 秒，极大降低笔记本电池与 CPU 开销；
   - 捕获端口文件变动、新窗口开启或客户端重启时，毫秒级恢复高频探测并重新自愈挂载。
4. **面向现代 AI 架构的开发者术语保留**：
   - 深度审校并规范开发者原生概念：完备保留 **Subagent**、**Hook**、**Sidecar**、**Slash Command**、**Token** 等术语，消除歧义与不准确的生硬字面直译。
5. **富文本输入框与模型区域隔离**：
   - 包含针对 Lexical 富文本编辑器、活动光标焦点（`document.activeElement`）、代码块及 AI 响应正文的物理隔离规则，防止打字中断或误翻正文。
   - 独立隔离模型选择器组件，模型技术标识与思考状态保持原生展示。
6. **自动化构建与转义工具链**：
   - 提供 `tools/build.js`，直接维护 `dict/zh-CN.json`，一键编译、压缩转义并生成独立的 `bin/antigravity-zh-patch.js`，Patch 版本号自动递增。

---

## 安装方法

### 方式一：macOS / Linux 一键安装（单行指令，无需提前克隆）

打开终端并直接运行：

```bash
curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/install.sh | bash
```

> **提示**：若希望一键同步中文智能体交互规范（强制中文，保留 Subagent、Hook、Sidecar 原生术语至 `~/.gemini/config/AGENTS.md`），可追加 `--with-rules`：
> ```bash
> curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/install.sh | bash -s -- --with-rules
> ```

安装脚本将自动执行以下操作：
* 将守护脚本部署至 `~/.antigravity-zh-cdp/bin/`；
* 在 macOS 上注册 `LaunchAgent`（`com.antigravity.zhpatch.plist`），实现开机自启与后台常驻；
* 如果当前 Antigravity 正在运行，脚本会立即完成注入，界面即时显示中文。

### 方式二：Windows 一键安装

在命令提示符或 PowerShell 中运行：

```bat
install.bat --with-rules
```

### 方式三：面向 AI 智能体（Agent）自动化安装

本项目原生支持 AI 编程助手（如 Cursor、Claude Code、Codex、Antigravity 等）执行无交互静默部署。详细调用约定请参见 [AGENTS.md](AGENTS.md)。

```bash
# 智能体专用无交互指令（输出标准化 JSON）
curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/install.sh | bash -s -- --agent --with-rules
```

---

## 开发与构建

本项目提供完善的工程化自动化工具链：

```bash
# 运行自动化测试套件（术语校验、DevToolsActivePort 机制、自适应退避与语法）
npm test

# 从 dict/zh-CN.json 自动构建编译独立补丁脚本（版本号自动递增）
npm run build
```

---

## 卸载方法

如需彻底移除汉化守护并恢复原生英文：

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/uninstall.sh | bash
```

### Windows

```bat
uninstall.bat
```

---

## 词库与覆盖范围

* **精确词条**：4,977 条（覆盖设置面板、侧边栏、控制面板、通知中心、快捷键、菜单项及内置插件）。
* **动态正则规则**：338 组（覆盖思考时间、工作耗时、相对时间戳、多步骤工具合并摘要等）。
* **适配版本**：Google Antigravity v2.26.0+（向下兼容 v2.18.0+）。

所有词条与规则已在 [`dict/zh-CN.json`](dict/zh-CN.json) 中完整开放。

---

## 致谢与开源溯源

本项目的词库建设与技术实现吸收借鉴了开源社区同类项目的经验与成果，特此致谢：

* **[yiheng8023/antigravity-chinese](https://github.com/yiheng8023/antigravity-chinese)**：
  - 本项目融合了其适配 Antigravity v2.26.0 的增量词库；
  - 借鉴了其针对部分动态正则规则的设计以及模型选择器边界隔离的思路。
* **[qqxpee/antigravity2-cn](https://github.com/qqxpee/antigravity2-cn)**：
  - 本项目融合了其基础词库与社区沉淀；
  - 本项目作者此前曾向其贡献 1,454 条 v2.18.1 简繁双语词条、Lexical 输入焦点保护及步骤耗时正则（详见 PR #34 及 commit `175cce6`）。
* **[kdczyz/antigravity-chinese](https://github.com/kdczyz/antigravity-chinese)**：
  - 感谢其早期通过 CDP 调试端口从外部进行页面探测与注入的原型探索。

---

## 许可证

本项目采用 [MIT License](LICENSE) 开源。
