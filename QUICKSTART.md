# Guia de Início Rápido - WnrMidia

## 🚀 Quick Start (5 minutos)

### Pré-requisitos
- Node.js 14+ instalado
- PostgreSQL 12+ instalado
- Git

### Passo 1: Preparar Banco de Dados

```bash
# No terminal do PostgreSQL
createdb wnrmidia

# Usuário padrão: postgres / Senha: postgres
```

### Passo 2: Clonar e Configurar

```bash
cd VS-Code_WnrMidia

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env (use seu editor favorito)
# Atualize: DATABASE_URL, JWT_SECRET, etc.
```

### Passo 3: Instalar Backend

```bash
cd backend

npm install

# Rodar migrations (criar tabelas)
npm run migrate

# Iniciar servidor
npm run dev
```

Backend rodará em: `http://localhost:5000`

### Passo 4: Instalar Admin Panel (nova aba/terminal)

```bash
cd admin-panel

npm install

npm start
```

Painel rodará em: `http://localhost:3000`

### Passo 5: Login

1. Acesse `http://localhost:3000`
2. Login com:
   - Email: `admin@wnrmidia.com`
   - Senha: `admin123`

## 📱 Usar Display Player (Electron)

```bash
cd frontend-player

npm install

npm run dev
```

## 🎯 Primeiros Passos no Painel

1. **Upload de Vídeo**
   - Vá para "Vídeos"
   - Clique em "Upload de Vídeo"
   - Selecione MP4 com 10-20 segundos
   - Clique em "Enviar"

2. **Criar Playlist**
   - Vá para "Playlists"
   - Clique em "Criar Nova Playlist"
   - Selecione a playlist criada
   - Adicione vídeos

3. **Criar Display**
   - Vá para "Displays"
   - Clique em "Adicionar Display"
   - Preencha nome, tipo (telão/outdoor/elevador/totem)
   - Clique em "Criar"

4. **Executar Player**
   - Inicie o Electron Player em outra máquina/terminal
   - Player se registrará automaticamente
   - Atribua uma playlist pelo painel

## 🔐 2FA Setup (Opcional)

1. No painel, vá para "Configurações" (quando implementado)
2. Clique em "Ativar 2FA"
3. Escaneie QR code com Google Authenticator/Authy
4. Digite código de 6 dígitos para confirmar

## 📊 Monitorar Displays

- Dashboard mostra displays online/offline
- WebSocket atualiza em tempo real
- Videos reproduzem em loop automático

## 🐛 Troubleshooting

### Erro de conexão ao banco
```bash
# Verificar se PostgreSQL está rodando
psql -U postgres

# Se erro, reinicie PostgreSQL
```

### Port 5000 já em uso
```bash
# Mudar porta no .env
PORT=5001

# E atualizar admin-panel .env
REACT_APP_API_URL=http://localhost:5001/api
```

### Port 3000 já em uso
```bash
# Terminal com admin-panel
npm start -- --port 3001
```

## 📚 Documentação Completa

Veja [README.md](./README.md) para documentação completa

## 💡 Tips

- Vídeos devem estar entre 10-20 segundos
- Use formato MP4 para compatibilidade
- Admin panel funciona em navegadores modernos
- Player Electron funciona em Windows/Mac/Linux

## 🤝 Suporte

Dúvidas? Veja a seção Troubleshooting no README.md

---

**Pronto para começar? 🎬**
