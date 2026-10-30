# AGENTS.md - Antigravity Chinese CDP 智能体操作规范

> 本文档专为 AI 智能体（包括 Antigravity、Cursor、Claude Code、Codex、OpenCode 等）编写。  
> 当人类用户要求配置、修复、汉化 Google Antigravity 或规范交互术语时，请优先阅读并执行本规范。

---

## 1. 核心架构与操作红线

1. **零进程中断（DO NOT KILL ANTIGRAVITY PROCESS）**：
   - 本项目通过 **Chrome DevTools Protocol (CDP)** 建立本地 WebSocket 连接，直接向 Electron 渲染层 V8 内存环境注入汉化脚本。
   - **绝对禁止执行 `pkill antigravity`、`taskkill /F /IM Antigravity.exe`**，否则会强制中断用户正在进行的会话，甚至造成宿主 Agent 自身崩溃。
2. **零文件系统污染（NON-INVASIVE）**：
   - 不需要解包、替换或修改 `app.asar`。
   - 保持官方二进制文件与数字签名完整性，在 macOS 上不会触发钥匙串（Safe Storage）密码弹窗。
3. **原生 DevToolsActivePort 机制与自适应退避（POWER-EFFICIENT）**：
   - 优先通过 Chromium 原生 `DevToolsActivePort` 机制探测调试端口，跨 macOS、Linux 与 Windows 原生无阻；
   - 守护进程引入自适应退避算法：注入稳定后将心跳拉长至 12 秒，在客户端重启或新窗口建立时立即毫秒级恢复高频自愈。
4. **现代开发者术语保留完备性（DEVELOPER-FIRST）**：
   - 严格保留 **Subagent**、**Hook**、**Sidecar**、**Slash Command**、**Token** 等原生术语，避免生硬或混淆的字面直译。

---

## 2. 智能体一键静默安装指令

在终端中直接执行以下命令（添加 `--agent` 标志将以无交互 JSON 模式运行；添加 `--with-rules` 可同步中文交互规范）：

### macOS / Linux

```bash
# 方式 A：单行远程一键安装（无需提前 Git Clone）
curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/install.sh | bash -s -- --agent --with-rules

# 方式 B：本地仓库执行
chmod +x ./install.sh && ./install.sh --agent --with-rules
```

成功返回值示例（退出码 0）：
```json
{"status":"success","daemon":"running","installed_path":"/Users/username/.antigravity-zh-cdp/bin/antigravity-zh-patch.js","os":"Darwin","with_rules":1}
```

### Windows (PowerShell)

```powershell
& "$env:USERPROFILE\.antigravity-zh-cdp\install.bat" --with-rules
```

---

## 3. 运行状态与健康自检

智能体可通过以下命令自检汉化守护状态：

### 检查守护进程是否存在
```bash
# macOS / Linux
ps -ef | grep "[a]ntigravity-zh-patch.js"

# macOS Launchd 状态
launchctl list | grep "com.antigravity.zhpatch"
```

### 查看实时注入日志
```bash
# macOS 日志路径
tail -n 20 ~/Library/Logs/AntigravityZhPatch/zhpatch.log

# Linux 日志路径
tail -n 20 ~/.local/state/antigravity-zh-patch/zhpatch.log
```

若日志中出现以下条目，即代表注入正常运转：
```text
[Injected] Target: "Antigravity" (...) - Chinese patch applied and observer active.
```

---

## 4. 自动化构建与测试

本项目提供现代工具链支持：

```bash
# 执行自动化测试（校验术语、DevToolsActivePort探测、自适应退避与语法）
npm test

# 从 dict/zh-CN.json 自动构建编译独立补丁脚本（版本号自动递增）
npm run build
```

---

## 5. 卸载指令

若用户要求恢复或卸载，直接运行：

```bash
curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/uninstall.sh | bash -s -- --agent
```
