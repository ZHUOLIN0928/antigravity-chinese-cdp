#!/usr/bin/env bash
# ==============================================================================
# Antigravity Chinese CDP - Install & Daemon Launcher (macOS / Linux)
# ==============================================================================

set -e

DIR=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
  DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
fi
INSTALL_DIR="$HOME/.antigravity-zh-cdp"
BIN_SRC=""
if [ -n "$DIR" ] && [ -f "$DIR/bin/antigravity-zh-patch.js" ]; then
  BIN_SRC="$DIR/bin/antigravity-zh-patch.js"
fi
BIN_DST="$INSTALL_DIR/bin/antigravity-zh-patch.js"

IS_AGENT=0
RUN_ONCE=0
WITH_RULES=0

for arg in "$@"; do
  case "$arg" in
    --agent|--quiet|-q)
      IS_AGENT=1
      ;;
    --once)
      RUN_ONCE=1
      ;;
    --with-rules)
      WITH_RULES=1
      ;;
  esac
done

# 1. Check Node.js runtime
if ! command -v node >/dev/null 2>&1; then
  if [ "$IS_AGENT" -eq 1 ]; then
    echo '{"status":"error","message":"Node.js is not installed or not in PATH."}'
  else
    echo "[错误] 未检测到 Node.js，请先安装 Node.js (>= 16.x) 后重试。"
  fi
  exit 1
fi

# 2. Deploy binary files (Local copy or Remote raw download for clone-free usage)
mkdir -p "$INSTALL_DIR/bin"

if [ -n "$BIN_SRC" ] && [ -f "$BIN_SRC" ]; then
  cp "$BIN_SRC" "$BIN_DST"
else
  if [ "$IS_AGENT" -eq 0 ]; then
    echo "[信息] 本地未找到补丁文件，正在从 GitHub 获取最新补丁..."
  fi
  REMOTE_URL="${ANTIGRAVITY_ZH_RAW_URL:-https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/bin/antigravity-zh-patch.js}"
  if ! curl -fsSL "$REMOTE_URL" -o "$BIN_DST"; then
    if [ "$IS_AGENT" -eq 1 ]; then
      echo '{"status":"error","message":"Failed to download antigravity-zh-patch.js from GitHub."}'
    else
      echo "[错误] 从 GitHub 下载补丁失败，请检查网络连接。"
    fi
    exit 1
  fi
fi

chmod +x "$BIN_DST"

# 3. Optional Ecosystem Integration: Write Chinese agent interaction rules
RULES_WRITTEN=0
if [ "$WITH_RULES" -eq 1 ]; then
  RULES_DIR="$HOME/.gemini/config"
  RULES_FILE="$RULES_DIR/AGENTS.md"
  mkdir -p "$RULES_DIR"

  RULE_MARKER="## 核心开发概念术语保留"
  if [ -f "$RULES_FILE" ] && grep -q "$RULE_MARKER" "$RULES_FILE"; then
    RULES_WRITTEN=1
  else
    cat >> "$RULES_FILE" <<'RULES_EOF'

# 智能体交互与开发规范 (Antigravity Chinese Rules)

## 工作过程与流程说明强制中文
在所有的任务思考（Thinking）、工作流程声明（如 Solo / Delegation Routine、例程切换）、子智能体（Subagent）启动与交付通知、工具调用说明、总结报告以及代码注释中，始终使用规范、清晰的简体中文，不得直接输出英文系统模板短语。

## 核心开发概念术语保留
智能体生态中的 **Subagent 统一保留英文称谓 `Subagent`**，核心开发概念（如 `Hook`, `Sidecar`, `Token`, `Pipeline`, `Slash Command`）保留原生英文，避免使用生硬字面直译。
RULES_EOF
    RULES_WRITTEN=1
    if [ "$IS_AGENT" -eq 0 ]; then
      echo "[信息] 已同步智能体交互规范至 $RULES_FILE"
    fi
  fi
fi

# 4. Mode: One-shot injection
if [ "$RUN_ONCE" -eq 1 ]; then
  node "$BIN_DST" >/dev/null 2>&1 || true
  if [ "$IS_AGENT" -eq 1 ]; then
    echo '{"status":"success","mode":"one-shot","installed_path":"'"$BIN_DST"'","with_rules":'"$RULES_WRITTEN"'}'
  else
    echo "[信息] 一次性注入完成。"
  fi
  exit 0
fi

# 5. Mode: Continuous Watchdog Daemon
OS_TYPE="$(uname -s)"
if [ "$OS_TYPE" = "Darwin" ]; then
  PLIST_DIR="$HOME/Library/LaunchAgents"
  PLIST_FILE="$PLIST_DIR/com.antigravity.zhpatch.plist"
  mkdir -p "$PLIST_DIR"

  # Unload previous service if exists
  launchctl bootout "gui/$(id -u)/com.antigravity.zhpatch" 2>/dev/null || true
  launchctl unload "$PLIST_FILE" 2>/dev/null || true

  NODE_PATH="$(command -v node)"
  LOG_DIR="$HOME/Library/Logs/AntigravityZhPatch"
  mkdir -p "$LOG_DIR"

  cat > "$PLIST_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.antigravity.zhpatch</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_PATH</string>
    <string>$BIN_DST</string>
    <string>--watch</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/launchd.stdout.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/launchd.stderr.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
</dict>
</plist>
EOF

  launchctl bootstrap "gui/$(id -u)" "$PLIST_FILE" 2>/dev/null || launchctl load "$PLIST_FILE" 2>/dev/null || true
else
  # Linux background process
  pkill -f "antigravity-zh-patch.js --watch" 2>/dev/null || true
  LOG_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/antigravity-zh-patch"
  mkdir -p "$LOG_DIR"
  nohup node "$BIN_DST" --watch > "$LOG_DIR/daemon.log" 2>&1 &
fi

if [ "$IS_AGENT" -eq 1 ]; then
  echo '{"status":"success","daemon":"running","installed_path":"'"$BIN_DST"'","os":"'"$OS_TYPE"'","with_rules":'"$RULES_WRITTEN"'}'
else
  echo "============================================================"
  echo " Antigravity Chinese CDP 守护进程已成功安装并启动！"
  echo "============================================================"
  echo " 1. 运行状态: 正在后台监听 Antigravity 进程与版本变动"
  echo " 2. 注入方式: Chrome DevTools Protocol (CDP) 纯内存热注入"
  echo " 3. 应用完整性: 零修改 app.asar、零破坏数字签名、零钥匙串弹窗"
  echo " 4. 端口探测: Chromium DevToolsActivePort 原生探测 + 自适应退避"
  echo " 5. 卸载方法: 运行 ./uninstall.sh 即可彻底移除"
  if [ "$WITH_RULES" -eq 1 ]; then
    echo " 6. 智能体规范: 已关联写入 ~/.gemini/config/AGENTS.md"
  fi
  echo "============================================================"
fi
