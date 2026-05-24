#!/bin/bash
# Script para instalar e iniciar WnrMidia em desenvolvimento

echo "🚀 WnrMidia Setup Script"
echo "=========================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale em https://nodejs.org"
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"

# Criar .env se não existir
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  Edite .env com suas credenciais"
fi

# Backend
echo ""
echo "📦 Instalando Backend..."
cd backend
npm install
echo "✅ Backend instalado"

echo ""
echo "🗄️  Rodando migrations..."
npm run migrate
echo "✅ Migrations concluídas"

cd ..

# Admin Panel
echo ""
echo "📦 Instalando Admin Panel..."
cd admin-panel
npm install
echo "✅ Admin Panel instalado"
cd ..

# Frontend Player
echo ""
echo "📦 Instalando Frontend Player..."
cd frontend-player
npm install
echo "✅ Frontend Player instalado"
cd ..

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "Para iniciar:"
echo "  Backend:      cd backend && npm run dev"
echo "  Admin Panel:  cd admin-panel && npm start"
echo "  Player:       cd frontend-player && npm run dev"
echo ""
echo "Acesse admin em: http://localhost:3000"
echo "API Backend: http://localhost:5000"
