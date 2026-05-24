@echo off
setlocal

REM ============================================================
REM  WnrMidia Player - Script de Vinculacao de Display
REM  Este script vincula este computador ao display "winner1"
REM ============================================================

set DISPLAY_ID=bd0bb0cf-a09b-447a-9515-8981b381a85b
set DISPLAY_NAME=winner1
set CONFIG_DIR=%APPDATA%\wnrmidia-player
set CONFIG_FILE=%CONFIG_DIR%\display-config.json

echo.
echo  WnrMidia Player - Vinculacao de Display
echo  =========================================
echo  Display: %DISPLAY_NAME%
echo  UUID:    %DISPLAY_ID%
echo.

REM Cria o diretorio se nao existir
if not exist "%CONFIG_DIR%" (
    mkdir "%CONFIG_DIR%"
    echo  [OK] Diretorio de configuracao criado.
)

REM Grava o arquivo de configuracao
echo {"displayId":"%DISPLAY_ID%"} > "%CONFIG_FILE%"

if exist "%CONFIG_FILE%" (
    echo  [OK] Display vinculado com sucesso!
    echo  [OK] Arquivo: %CONFIG_FILE%
) else (
    echo  [ERRO] Nao foi possivel criar o arquivo de configuracao.
    pause
    exit /b 1
)

REM Remove variavel que impede o Electron de funcionar corretamente
set ELECTRON_RUN_AS_NODE=

echo.
echo  Agora inicie o WnrMidia Player normalmente.
echo  Este computador sera identificado como "%DISPLAY_NAME%".
echo.
pause
