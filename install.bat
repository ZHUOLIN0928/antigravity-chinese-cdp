@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "INSTALL_DIR=%USERPROFILE%\.antigravity-zh-cdp"
set "BIN_SRC=%~dp0bin\antigravity-zh-patch.js"
set "BIN_DST=%INSTALL_DIR%\bin\antigravity-zh-patch.js"
set "WITH_RULES=0"
set "RUN_ONCE=0"

for %%a in (%*) do (
    if "%%a"=="--with-rules" set "WITH_RULES=1"
    if "%%a"=="--once" set "RUN_ONCE=1"
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js (>= 16.x) 并加入系统环境变量 PATH。
    exit /b 1
)

if not exist "%INSTALL_DIR%\bin" mkdir "%INSTALL_DIR%\bin"

if exist "%BIN_SRC%" (
    copy /y "%BIN_SRC%" "%BIN_DST%" >nul
) else (
    echo [信息] 本地未找到补丁文件，正在从 GitHub 官方源下载最新补丁...
    curl -fsSL https://raw.githubusercontent.com/ZHUOLIN0928/antigravity-chinese-cdp/main/bin/antigravity-zh-patch.js -o "%BIN_DST%"
    if !errorlevel! neq 0 (
        echo [错误] 从 GitHub 下载补丁失败，请检查网络连接。
        exit /b 1
    )
)

if "%WITH_RULES%"=="1" (
    set "RULES_DIR=%USERPROFILE%\.gemini\config"
    set "RULES_FILE=%RULES_DIR%\AGENTS.md"
    if not exist "!RULES_DIR!" mkdir "!RULES_DIR!"
    findstr /C:"核心开发概念术语保留" "!RULES_FILE!" >nul 2>nul
    if !errorlevel! neq 0 (
        (
            echo.
            echo # 智能体交互与开发规范 (Antigravity Chinese Rules^)
            echo.
            echo ## 工作过程与流程说明强制中文
            echo 在所有的任务思考（Thinking）、工作流程声明（如 Solo / Delegation Routine、例程切换）、子智能体（Subagent）启动与交付通知、工具调用说明、总结报告以及代码注释中，始终使用规范、清晰的简体中文，不得直接输出英文系统模板短语。
            echo.
            echo ## 核心开发概念术语保留
            echo 智能体生态中的 **Subagent 统一保留英文称谓 `Subagent`**，核心开发概念（如 `Hook`, `Sidecar`, `Token`, `Pipeline`, `Slash Command`）保留原生英文，避免使用生硬字面直译。
        ) >> "!RULES_FILE!"
        echo [信息] 中文智能体规范已写入 !RULES_FILE!
    )
)

if "%RUN_ONCE%"=="1" (
    node "%BIN_DST%"
    echo [信息] 一次性注入完成。
    exit /b 0
)

taskkill /F /FI "WINDOWTITLE eq AntigravityZhPatchDaemon*" >nul 2>nul

echo [信息] 正在启动 Antigravity Chinese CDP 守护进程...
start "AntigravityZhPatchDaemon" /min node "%BIN_DST%" --watch

echo ============================================================
echo  Antigravity Chinese CDP 守护进程已启动！
echo  运行方式: 后台监听 Chrome DevTools Protocol 内存热注入
echo  特性支持: DevToolsActivePort 原生探测 + 自适应退避省电
echo  无需重启客户端，无需修改安装包文件。
echo ============================================================
endlocal
