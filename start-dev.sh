#!/bin/bash
# Script para iniciar todos os serviços em desenvolvimento
# Use: bash start-dev.sh

echo "🚀 Iniciando WnrMidia em modo desenvolvimento..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se está na raiz do projeto
if [ ! -d "backend" ] || [ ! -d "admin-panel" ] || [ ! -d "frontend-player" ]; then
    echo "❌ Execute este script na raiz do projeto WnrMidia"
    exit 1
fi

# Criar função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Encerrando serviços..."
    jobs -p | xargs kill 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Backend
echo -e "${BLUE}📦 Iniciando Backend (Port 5000)...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend iniciado (PID: $BACKEND_PID)${NC}"
cd ..

# Aguardar backend ficar pronto
echo "⏳ Aguardando backend..."
sleep 3

# Admin Panel
echo -e "${BLUE}⚛️  Iniciando Admin Panel (Port 3000)...${NC}"
cd admin-panel
npm start > ../admin.log 2>&1 &
ADMIN_PID=$!
echo -e "${GREEN}✅ Admin Panel iniciado (PID: $ADMIN_PID)${NC}"
cd ..

# Player (opcional - comentado por padrão)
# echo -e "${BLUE}🖥️  Iniciando Player (Electron)...${NC}"
# cd frontend-player
# npm run dev > ../player.log 2>&1 &
# PLAYER_PID=$!
# echo -e "${GREEN}✅ Player iniciado${NC}"
# cd ..

echo ""
echo "════════════════════════════════════════════"
echo -e "${GREEN}✅ WnrMidia iniciado com sucesso!${NC}"
echo "════════════════════════════════════════════"
echo ""
echo "🌐 Acessar:"
echo "   Admin Panel: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo ""
echo "👤 Login padrão:"
echo "   Email: admin@wnrmidia.com"
echo "   Senha: admin123"
echo ""
echo "📋 Para visualizar logs:"
echo "   Backend:  tail -f backend.log"
echo "   Admin:    tail -f admin.log"
echo ""
echo "🛑 Para parar: Ctrl+C"
echo ""

# Manter os processos rodando
wait
