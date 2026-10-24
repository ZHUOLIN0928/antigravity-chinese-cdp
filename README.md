# Antigravity Chinese CDP (antigravity-chinese-cdp)

基于 Chrome DevTools Protocol (CDP) 运行期内存注入的 Google Antigravity 中文本地化与更新自愈套件。

---

## 机制特点

1. **零文件修改与完整签名保留**：
   - 不修改或替换客户端的 `app.asar` 文件。
   - 保留 Google 官方二进制数字签名，在 macOS 下不会因代码签名变动而触发钥匙串（Safe Storage）访问授权弹窗。
2. **零停机内存热注入**：
   - 通过本地 CDP WebSocket 端口与运行中的 Chromium 渲染进程建立连接，直接向前端上下文注入语言包与观察器。
   - 安装与升级过程中无需关闭或重启 Antigravity 客户端。
3. **版本更新自愈**：
   - 守护进程持续监听客户端进程与端口状态。客户端完成版本升级并重启后，守护进程会自动重新连接并注入，无需重新执行安装。
4. **原生右键菜单内存拦截**：
   - 针对 Electron 桌面端原生上下文菜单（Context Menu）与二级子菜单，通过前端模板构建阶段的特征拦截，在内存中完成汉化，无需依赖修改主进程文件。
5. **富文本输入框与模型区域隔离**：
   - 包含针对 Lexical 富文本编辑器、活动光标焦点（`document.activeElement`）、代码块及 AI 响应正文的物理隔离规则，防止打字中断或误翻正文。
   - 独立隔离模型选择器组件，模型技术标识与思考状态保持原生展示。

---

## 安装方法

### 方式一：macOS / Linux 一键安装

打开终端并运行：

```bash
curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/install.sh | bash
```

安装脚本将自动执行以下操作：
* 将守护脚本部署至 `~/.antigravity-zh-cdp/bin/`；
* 在 macOS 上注册 `LaunchAgent`（`com.antigravity.zhpatch.plist`），实现开机自启与后台常驻；
* 如果当前 Antigravity 正在运行，脚本会立即完成注入，界面即时显示中文。

### 方式二：Windows 一键安装

在命令提示符或 PowerShell 中克隆本仓库后运行：

```bat
install.bat
```

### 方式三：面向 AI 智能体（Agent）自动化安装

本项目原生支持 AI 编程助手（如 Cursor、Claude Code、Codex、Antigravity 等）执行无交互静默部署。详细调用约定请参见 [AGENTS.md](AGENTS.md)。

```bash
# 智能体专用无交互指令（输出标准化 JSON）
curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/install.sh | bash -s -- --agent
```

---

## 卸载方法

如需彻底移除汉化守护并恢复原生英文：

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/uninstall.sh | bash
```

### Windows

运行仓库目录下的 `uninstall.bat`。

---

## 词库与覆盖范围

* **精确词条**：4,971 条（覆盖设置面板、侧边栏、控制面板、通知中心、快捷键、菜单项及内置插件）。
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
