
# WnrMidia - Sumário Visual da Estrutura

```
📦 VS-Code_WnrMidia (Raiz do Projeto)
│
├─ 📁 backend/                          🔧 Node.js + Express + PostgreSQL
│  ├─ 📁 src/
│  │  ├─ 📄 server.js                   ⭐ Arquivo principal
│  │  ├─ 📄 config/database.js
│  │  ├─ 📄 middleware/
│  │  │  ├─ authMiddleware.js           🔐 JWT + validação
│  │  │  └─ errorHandler.js
│  │  ├─ 📄 routes/                     🔗 API Endpoints
│  │  │  ├─ auth.js                     👤 Autenticação
│  │  │  ├─ displays.js                 📺 CRUD displays
│  │  │  ├─ videos.js                   🎬 Upload/gerenciar
│  │  │  ├─ playlists.js                📋 Playlists
│  │  │  ├─ users.js                    👥 Usuários
│  │  │  └─ analytics.js                📊 Dados
│  │  └─ 📄 services/ (expandir aqui)
│  ├─ 📁 migrations/
│  │  ├─ 📄 001_create_tables.js        📊 Schema
│  │  └─ 📄 002_seed_users.js           🌱 Dados iniciais
│  ├─ 📄 knexfile.js                    ⚙️ Config DB
│  ├─ 📄 package.json
│  └─ 📄 README.md
│
├─ 📁 frontend-player/                  🖥️ Electron + React
│  ├─ 📁 public/
│  │  ├─ 📄 main.js                     ⭐ Processo principal
│  │  ├─ 📄 preload.js                  🔌 IPC API
│  │  ├─ 📄 index.html
│  │  └─ 📄 favicon.ico
│  ├─ 📁 src/
│  │  ├─ 📄 Player.js                   🎥 Componente reprodutor
│  │  ├─ 📄 Player.css                  🎨 Estilos
│  │  ├─ 📄 index.js
│  │  └─ 📄 index.html
│  ├─ 📄 package.json
│  └─ 📄 README.md
│
├─ 📁 admin-panel/                      ⚛️ React Web
│  ├─ 📁 public/
│  │  ├─ 📄 index.html
│  │  └─ 📄 favicon.ico
│  ├─ 📁 src/
│  │  ├─ 📄 App.js                      ⭐ Componente raiz
│  │  ├─ 📄 App.css                     🎨 Estilos principais
│  │  ├─ 📄 index.js
│  │  ├─ 📄 index.css
│  │  ├─ 📁 pages/
│  │  │  ├─ 📄 Login.js / .css          🔐 Autenticação
│  │  │  ├─ 📄 Dashboard.js / .css      📊 Painel principal
│  │  │  ├─ 📄 Videos.js / .css         🎬 Gerenciar vídeos
│  │  │  ├─ 📄 Playlists.js / .css      📋 Gerenciar playlists
│  │  │  ├─ 📄 Displays.js / .css       📺 Gerenciar displays
│  │  │  └─ 📄 Settings.js / .css       ⚙️ Configurações
│  │  ├─ 📁 components/                 🧩 Componentes reutilizáveis
│  │  └─ 📁 services/                   🔗 Serviços API
│  ├─ 📄 package.json
│  └─ 📄 README.md
│
├─ 📁 .github/
│  └─ 📄 copilot-instructions.md        🤖 Instruções customizadas
│
├─ 📁 uploads/                          📦 Armazenamento local
│  └─ 📁 videos/                        🎬 Vídeos enviados
│
├─ 📄 .env.example                      ⚙️ Template variáveis
├─ 📄 .gitignore                        🚫 Arquivos ignorados
├─ 📄 docker-compose.yml                🐳 Containers (optional)
├─ 📄 setup.sh                          🔧 Setup (Linux/Mac)
├─ 📄 setup.bat                         🔧 Setup (Windows)
│
├─ 📄 README.md                         📖 Documentação principal
├─ 📄 QUICKSTART.md                     🚀 Guia rápido
├─ 📄 ARCHITECTURE.md                   🏗️ Arquitetura
├─ 📄 DEVELOPMENT.md                    👨‍💻 Padrões desenvolvimento
└─ 📄 ROADMAP.md                        📅 Roteiro futuro
```

---

## 🚀 Como Começar

### 1️⃣ Instalação Rápida (5 min)
```bash
# Windows
setup.bat

# Linux/Mac
bash setup.sh
```

### 2️⃣ Iniciar Serviços

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```
➡️ `http://localhost:5000`

**Terminal 2 - Admin Panel**
```bash
cd admin-panel
npm start
```
➡️ `http://localhost:3000`

**Terminal 3 - Player (opcional)**
```bash
cd frontend-player
npm run dev
```
➡️ Electron Window

### 3️⃣ Primeiro Login
```
Email: admin@wnrmidia.com
Senha: admin123
```

---

## 📊 Fluxo Principal

```
┌─────────────────┐
│   Admin Panel   │
│   (React)       │
└────────┬────────┘
         │ Upload vídeo
         ▼
┌─────────────────┐
│  Backend API    │     ◀──── Requisições HTTP
│  (Express)      │────────►
└────────┬────────┘     ▲
         │              │ WebSocket
         ▼              │
┌─────────────────┐     │
│  PostgreSQL     │     │
│  (Banco Dados)  │     │
└─────────────────┘     │
         ▲              │
         │ Query        │
         └──────────────┘
              │ emit events
              ▼
       ┌─────────────────┐
       │ Display Player  │
       │  (Electron)     │
       └─────────────────┘
              │
              ▼
         🎬 Reproduz Vídeos
```

---

## 🔑 Componentes-Chave

### Backend Routes
| Método | Endpoint | Função |
|--------|----------|--------|
| POST | `/api/auth/login` | Login do usuário |
| POST | `/api/auth/register` | Registrar novo usuário |
| GET | `/api/displays` | Listar displays |
| POST | `/api/displays` | Criar display |
| POST | `/api/videos/upload` | Upload de vídeo |
| POST | `/api/playlists` | Criar playlist |
| PUT | `/api/playlists/:id/reorder` | Reordenar vídeos |

### Database Tables
- `users` - Usuários do sistema
- `displays` - Equipamentos (telões, etc)
- `videos` - Vídeos enviados
- `playlists` - Coleções de vídeos
- `playlist_videos` - Relação M2M
- `display_playlists` - Atribuição
- `analytics` - Dados de reprodução
- `sync_logs` - Histórico de sincronização

### WebSocket Events
- `register_display` - Display se registra
- `playlist_updated` - Playlist foi atualizada
- `playlist_reordered` - Vídeos reordenados
- `playlist_changed` - Vídeo adicionado/removido

---

## 📦 Dependências Principais

### Backend
```json
{
  "express": "API REST",
  "pg": "Conectar PostgreSQL",
  "knex": "Query builder",
  "jsonwebtoken": "JWT tokens",
  "bcryptjs": "Hash de senhas",
  "speakeasy": "2FA (TOTP)",
  "socket.io": "Real-time",
  "multer": "Upload de arquivos"
}
```

### Admin Panel
```json
{
  "react": "Interface",
  "react-router-dom": "Navegação",
  "axios": "HTTP client",
  "react-hot-toast": "Notificações"
}
```

### Player
```json
{
  "electron": "Desktop app",
  "react": "Interface",
  "socket.io-client": "Conexão em tempo real"
}
```

---

## 🎯 Próximas Prioridades

1. ✅ **MVP Completo** - Tudo pronto
2. ⏳ **Rate Limiting** - Proteção de API
3. ⏳ **Testes Automatizados** - Jest + React Testing
4. ⏳ **CI/CD** - GitHub Actions
5. ⏳ **Agendamento de Playlists** - Timebase
6. ⏳ **Analytics Avançado** - Dashboard detalhado
7. ⏳ **Deployment** - Docker + Nginx

---

## 📞 Suporte Rápido

| Problema | Solução |
|----------|---------|
| Port 5000 em uso | `PORT=5001 npm run dev` |
| Banco não conecta | Verificar PostgreSQL rodando |
| Build falha | `npm cache clean --force` |
| Senha esquecida | Resetar BD: `npm run migrate` |

---

## 📝 Arquivos de Referência

- **Como começar?** → [QUICKSTART.md](./QUICKSTART.md)
- **Estrutura técnica?** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Padrões de código?** → [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Futuro do projeto?** → [ROADMAP.md](./ROADMAP.md)
- **Uso completo?** → [README.md](./README.md)

---

**🎉 Projeto pronto para desenvolvimento!**

Comece com: `bash setup.sh` (ou `setup.bat` no Windows)
