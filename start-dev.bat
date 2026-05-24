@echo off
REM Script para iniciar todos os serviços em desenvolvimento (Windows)
REM Use: start-dev.bat

echo.
echo ===== WnrMidia - Iniciando em modo desenvolvimento =====
echo.

REM Verificar se está na raiz do projeto
if not exist "backend" (
    echo Erro: Execute este script na raiz do projeto WnrMidia
    pause
    exit /b 1
)

echo.
echo [1/3] Iniciando Backend (Port 5000)...
start "WnrMidia Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak

echo.
echo [2/3] Iniciando Admin Panel (Port 3000)...
start "WnrMidia Admin Panel" cmd /k "cd admin-panel && npm start"
timeout /t 2 /nobreak

REM Descomente para iniciar Player também:
REM echo.
REM echo [3/3] Iniciando Player (Electron)...
REM start "WnrMidia Player" cmd /k "cd frontend-player && npm run dev"

echo.
echo ===== Todos os serviços iniciados! =====
echo.
echo [i] Admin Panel: http://localhost:3000
echo [i] Backend API: http://localhost:5000
echo [i] Login: admin@wnrmidia.com / admin123
echo.
echo [i] Para parar: Feche as janelas de terminal
echo.
pause
