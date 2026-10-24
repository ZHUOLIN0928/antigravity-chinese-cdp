@echo off
chcp 65001 >nul
setlocal

set "INSTALL_DIR=%USERPROFILE%\.antigravity-zh-cdp"
set "BIN_SRC=%~dp0bin\antigravity-zh-patch.js"
set "BIN_DST=%INSTALL_DIR%\bin\antigravity-zh-patch.js"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js (>= 16.x) 并加入系统环境变量 PATH。
    exit /b 1
)

if not exist "%INSTALL_DIR%\bin" mkdir "%INSTALL_DIR%\bin"
copy /y "%BIN_SRC%" "%BIN_DST%" >nul

taskkill /F /FI "WINDOWTITLE eq AntigravityZhPatchDaemon*" >nul 2>nul

echo [信息] 正在启动 Antigravity Chinese CDP 守护进程...
start "AntigravityZhPatchDaemon" /min node "%BIN_DST%" --watch

echo ============================================================
echo  Antigravity Chinese CDP 守护进程已启动！
echo  运行方式: 后台监听 Chrome DevTools Protocol 内存热注入
echo  无需重启客户端，无需修改安装包文件。
echo ============================================================
endlocal
