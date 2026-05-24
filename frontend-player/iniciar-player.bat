@echo off
REM ============================================================
REM  WnrMidia Player - Iniciador
REM ============================================================

REM Limpa variavel que bloqueia o Electron
set ELECTRON_RUN_AS_NODE=

set ELECTRON_EXE=%~dp0node_modules\electron\dist\electron.exe
set APP_DIR=%~dp0
set APP_DIR=%APP_DIR:~0,-1%

if not exist "%ELECTRON_EXE%" (
    echo [ERRO] Electron nao encontrado. Execute "npm install" primeiro.
    pause
    exit /b 1
)

REM Mata qualquer processo rodando na porta 3001
echo Liberando porta 3001...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

REM Inicia o React (BROWSER=none esta no package.json)
echo Iniciando servidor React na porta 3001...
start "WnrMidia React" /min cmd /c "cd /d "%APP_DIR%" && npm run react-start"

REM Aguarda o React estar pronto usando curl
echo Aguardando servidor iniciar...
:aguarda
timeout /t 2 /nobreak >nul
curl -sf --max-time 2 http://localhost:3001 >nul 2>&1
if %errorlevel% neq 0 goto aguarda

echo [OK] Servidor React pronto na porta 3001!
echo Iniciando WnrMidia Player...
"%ELECTRON_EXE%" "%APP_DIR%"