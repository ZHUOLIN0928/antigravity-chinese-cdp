@echo off
chcp 65001 >nul
setlocal

taskkill /F /FI "WINDOWTITLE eq AntigravityZhPatchDaemon*" >nul 2>nul
wmic process where "commandline like '%%antigravity-zh-patch.js%%'" call terminate >nul 2>nul

set "INSTALL_DIR=%USERPROFILE%\.antigravity-zh-cdp"
if exist "%INSTALL_DIR%" rmdir /s /q "%INSTALL_DIR%"

echo [信息] Antigravity Chinese CDP 守护进程已停止并清理完成。
endlocal
