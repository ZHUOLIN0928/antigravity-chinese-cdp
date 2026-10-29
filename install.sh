#!/usr/bin/env bash
# ==============================================================================
# Antigravity Chinese CDP - Install & Daemon Launcher (macOS / Linux)
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$HOME/.antigravity-zh-cdp"
BIN_SRC="$DIR/bin/antigravity-zh-patch.js"
BIN_DST="$INSTALL_DIR/bin/antigravity-zh-patch.js"
LOG_DIR="$HOME/Library/Logs/AntigravityZhPatch"

IS_AGENT=0
RUN_ONCE=0

for arg in "$@"; do
  case "$arg" in
    --agent|--quiet|-q)
      IS_AGENT=1
      ;;
    --once)
      RUN_ONCE=1
      ;;
  esac
done

# 1. Check Node.js runtime
if ! command -v node >/dev/null 2>&1; then
  if [ "$IS_AGENT" -eq 1 ]; then
    echo '{"status":"error","message":"Node.js is not installed or not in PATH."}'
  else
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js (>= 16.x) 后重试。"
  fi
  exit 1
fi

# 2. Deploy binary files
mkdir -p "$INSTALL_DIR/bin" "$LOG_DIR"
cp "$BIN_SRC" "$BIN_DST"
chmod +x "$BIN_DST"

# 3. Mode: One-shot injection
if [ "$RUN_ONCE" -eq 1 ]; then
  node "$BIN_DST" >/dev/null 2>&1 || true
  if [ "$IS_AGENT" -eq 1 ]; then
    echo '{"status":"success","mode":"one-shot","installed_path":"'"$BIN_DST"'"}'
  else
    echo "✅ 一次性注入完成。"
  fi
  exit 0
fi

# 4. Mode: Continuous Watchdog Daemon
OS_TYPE="$(uname -s)"
if [ "$OS_TYPE" = "Darwin" ]; then
  PLIST_DIR="$HOME/Library/LaunchAgents"
  PLIST_FILE="$PLIST_DIR/com.antigravity.zhpatch.plist"
  mkdir -p "$PLIST_DIR"

  # Unload previous service if exists
  launchctl bootout "gui/$(id -u)/com.antigravity.zhpatch" 2>/dev/null || true
  launchctl unload "$PLIST_FILE" 2>/dev/null || true

  NODE_PATH="$(command -v node)"

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
  nohup node "$BIN_DST" --watch > "$LOG_DIR/daemon.log" 2>&1 &
fi

if [ "$IS_AGENT" -eq 1 ]; then
  echo '{"status":"success","daemon":"running","installed_path":"'"$BIN_DST"'","os":"'"$OS_TYPE"'"}'
else
  echo "============================================================"
  echo " Antigravity Chinese CDP 守护进程已成功安装并启动！"
  echo "============================================================"
  echo " 1. 运行状态: 正在后台监听 Antigravity 进程与版本变动"
  echo " 2. 注入方式: Chrome DevTools Protocol (CDP) 纯内存热注入"
  echo " 3. 应用完整性: 零修改 app.asar、零破坏数字签名、零钥匙串弹窗"
  echo " 4. 日志路径: $LOG_DIR/zhpatch.log"
  echo " 5. 卸载方法: 运行 ./uninstall.sh 即可彻底移除"
  echo "============================================================"
fi
