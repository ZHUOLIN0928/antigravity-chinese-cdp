#!/usr/bin/env bash
# ==============================================================================
# Antigravity Chinese CDP - Uninstall & Cleanup (macOS / Linux)
# ==============================================================================

set -e

INSTALL_DIR="$HOME/.antigravity-zh-cdp"
PLIST_FILE="$HOME/Library/LaunchAgents/com.antigravity.zhpatch.plist"

IS_AGENT=0
for arg in "$@"; do
  if [ "$arg" = "--agent" ] || [ "$arg" = "--quiet" ] || [ "$arg" = "-q" ]; then
    IS_AGENT=1
  fi
done

# 1. Stop launchd on macOS
if [ -f "$PLIST_FILE" ]; then
  launchctl bootout "gui/$(id -u)/com.antigravity.zhpatch" 2>/dev/null || true
  launchctl unload "$PLIST_FILE" 2>/dev/null || true
  rm -f "$PLIST_FILE"
fi

# 2. Kill any running patch processes
pkill -f "antigravity-zh-patch.js" 2>/dev/null || true

# 3. Remove files
rm -rf "$INSTALL_DIR"

if [ "$IS_AGENT" -eq 1 ]; then
  echo '{"status":"success","action":"uninstalled"}'
else
  echo "[信息] Antigravity Chinese CDP 守护进程已停止，相关配置已清理完成。"
fi
