#!/bin/bash
# =============================================================
# WnrMidia - Script de Deploy na VM Azure
# VM: 4.228.218.45  |  Repo: rafaellmathias85-ui/wnrmidia
# Executar como: bash deploy-azure.sh
# =============================================================

set -e

APP_DIR="/var/www/wnrmidia"
REPO_URL="https://github.com/rafaellmathias85-ui/wnrmidia.git"
DOMAIN="4.228.218.45"

echo "======================================"
echo "  WnrMidia - Deploy Azure"
echo "======================================"

# --- 1. Dependências do sistema ---
echo "[1/8] Atualizando sistema e instalando dependências..."
sudo apt-get update -qq
sudo apt-get install -y -qq git curl nginx ffmpeg

# --- 2. Node.js (via nvm ou nodesource) ---
echo "[2/8] Verificando Node.js..."
if ! command -v node &> /dev/null; then
  echo "  Instalando Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "  Node.js $(node --version) já instalado."
fi

# --- 3. PM2 ---
echo "[3/8] Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# --- 4. Clone / atualização do repositório ---
echo "[4/8] Clonando/atualizando repositório..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  sudo mkdir -p "$APP_DIR"
  sudo chown $USER:$USER "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# --- 5. Backend ---
echo "[5/8] Configurando backend..."
cd "$APP_DIR/backend"
npm install --production

# Criar .env de produção se não existir
if [ ! -f .env ]; then
  cat > .env << EOF
NODE_ENV=development
PORT=5000
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRE=7d
VIDEO_UPLOAD_PATH=./uploads/videos
MAX_VIDEO_SIZE=500000000
EOF
  echo "  .env criado com segredos gerados automaticamente"
fi

# Criar pasta de uploads
mkdir -p uploads/videos

# Rodar migrações
echo "  Rodando migrações..."
npx knex migrate:latest
npx knex seed:run --specific=001_users.js 2>/dev/null || true

# --- 6. Admin Panel (build) ---
echo "[6/8] Buildando admin panel..."
cd "$APP_DIR/admin-panel"
npm install

# Criar .env para produção apontando para IP da VM
cat > .env.production << EOF
REACT_APP_API_URL=http://$DOMAIN:5000/api
REACT_APP_SOCKET_URL=http://$DOMAIN:5000
EOF

npm run build

# --- 7. PM2 ---
echo "[7/8] Iniciando/reiniciando serviços com PM2..."
cd "$APP_DIR"

# Criar ecosystem PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'wnrmidia-backend',
    script: './backend/src/server.js',
    cwd: '$APP_DIR',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    watch: false,
    max_memory_restart: '512M',
    restart_delay: 5000,
  }]
}
EOF

pm2 stop wnrmidia-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

# --- 8. Nginx ---
echo "[8/8] Configurando nginx..."
sudo tee /etc/nginx/sites-available/wnrmidia > /dev/null << EOF
server {
    listen 8080;
    server_name $DOMAIN;

    # Admin panel (React build)
    root $APP_DIR/admin-panel/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy para o backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }

    location /uploads {
        proxy_pass http://localhost:5000;
        client_max_body_size 500M;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/wnrmidia /etc/nginx/sites-enabled/wnrmidia
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "======================================"
echo "  Deploy concluido com sucesso!"
echo "======================================"
echo ""
echo "  Admin Panel : http://$DOMAIN:8080"
echo "  Backend API : http://$DOMAIN:5000/api"
echo "  Status PM2  : pm2 status"
echo "  Logs        : pm2 logs wnrmidia-backend"
echo ""
echo "  Login padrão:"
echo "  Email : admin@wnrmidia.com"
echo "  Senha : (definida no seed)"
echo ""
