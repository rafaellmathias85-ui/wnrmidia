@echo off
REM Script para instalar e iniciar WnrMidia em desenvolvimento (Windows)

echo.
echo ===== WnrMidia Setup Script (Windows) =====
echo.

REM Verificar Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo Erro: Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)

echo OK: Node.js instalado
node -v
npm -v

REM Criar .env se nao existir
if not exist ".env" (
    echo.
    echo Criando arquivo .env...
    copy .env.example .env
    echo Aviso: Edite .env com suas credenciais
)

REM Backend
echo.
echo Instalando Backend...
cd backend
call npm install
echo OK: Backend instalado

echo.
echo Rodando migrations...
call npm run migrate
echo OK: Migrations concluidas

cd ..

REM Admin Panel
echo.
echo Instalando Admin Panel...
cd admin-panel
call npm install
echo OK: Admin Panel instalado
cd ..

REM Frontend Player
echo.
echo Instalando Frontend Player...
cd frontend-player
call npm install
echo OK: Frontend Player instalado
cd ..

echo.
echo ===== Instalacao concluida! =====
echo.
echo Para iniciar:
echo   Backend:      cd backend ^&^& npm run dev
echo   Admin Panel:  cd admin-panel ^&^& npm start
echo   Player:       cd frontend-player ^&^& npm run dev
echo.
echo Acesse admin em: http://localhost:3000
echo API Backend: http://localhost:5000
echo.
pause
