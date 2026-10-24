# AGENTS.md - Antigravity Chinese CDP 智能体操作规范

> 本文档专为 AI 智能体（包括 Antigravity、Cursor、Claude Code、Codex、OpenCode 等）编写。  
> 当人类用户要求配置、修复或汉化 Google Antigravity 时，请优先阅读并执行本规范。

---

## 1. 核心架构与操作红线

1. **零进程中断（DO NOT KILL ANTIGRAVITY PROCESS）**：
   - 本项目通过 **Chrome DevTools Protocol (CDP)** 建立本地 WebSocket 连接，直接向 Electron 渲染层 V8 内存环境注入汉化脚本。
   - **绝对禁止执行 `pkill antigravity`、`taskkill /F /IM Antigravity.exe`**，否则会强制中断用户正在进行的会话，甚至造成宿主 Agent 自身崩溃。
2. **零文件系统污染（NON-INVASIVE）**：
   - 不需要解包、替换或修改 `app.asar`。
   - 保持官方二进制文件与数字签名完整性，在 macOS 上不会触发钥匙串（Safe Storage）密码弹窗。
3. **版本自愈（AUTO-HEALING）**：
   - 守护进程通过轮询监听主进程调试端口。当用户或系统静默更新 Antigravity 客户端并重启后，守护进程将在毫秒级重新挂载注入，无需人工重复打补丁。

---

## 2. 智能体一键静默安装指令

在终端中直接执行以下命令（添加 `--agent` 标志将以无交互 JSON 模式运行）：

### macOS / Linux

```bash
# 方式 A：本地已有仓库时
chmod +x ./install.sh && ./install.sh --agent

# 方式 B：远端一键安装（单行指令）
curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/install.sh | bash -s -- --agent
```

成功返回值示例（退出码 0）：
```json
{"status":"success","daemon":"running","installed_path":"/Users/username/.antigravity-zh-cdp/bin/antigravity-zh-patch.js","os":"Darwin"}
```

### Windows (PowerShell)

```powershell
& "$env:USERPROFILE\.antigravity-zh-cdp\install.bat"
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
# 查看最近 20 行日志
tail -n 20 ~/Library/Logs/AntigravityZhPatch/zhpatch.log
```

若日志中出现以下条目，即代表注入正常运转：
```text
[Injected] Target: "Antigravity" (...) - Chinese patch applied and observer active.
```

---

## 4. 卸载指令

若用户要求恢复或卸载，直接运行：

```bash
curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/uninstall.sh | bash -s -- --agent
```
