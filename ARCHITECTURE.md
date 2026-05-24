# Estrutura do Projeto WnrMidia

## Backend (Node.js + Express + PostgreSQL)

```
backend/
├── src/
│   ├── server.js                 # Arquivo principal, Express + Socket.IO
│   ├── config/
│   │   └── database.js           # Configuração do Knex
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT + verificação de permissões
│   │   └── errorHandler.js       # Tratamento de erros
│   ├── routes/
│   │   ├── auth.js               # Autenticação, 2FA, OAuth
│   │   ├── displays.js           # CRUD de displays
│   │   ├── videos.js             # Upload e gerenciamento de vídeos
│   │   ├── playlists.js          # CRUD de playlists
│   │   ├── users.js              # Gerenciamento de usuários
│   │   └── analytics.js          # Endpoints de analytics
│   ├── controllers/              # Lógica de negócio (opcional, expandir depois)
│   ├── services/                 # Serviços auxiliares
│   ├── models/                   # Modelos de dados
│   └── utils/                    # Utilitários
├── migrations/
│   ├── 001_create_tables.js      # Tabelas principais
│   └── 002_seed_users.js         # Dados iniciais
├── uploads/
│   └── videos/                   # Local para vídeos enviados
├── knexfile.js                   # Configuração Knex
├── package.json
├── .env.example
└── README.md
```

## Frontend Player (Electron + React)

```
frontend-player/
├── public/
│   ├── main.js                   # Processo principal Electron
│   ├── preload.js                # API entre processos
│   ├── index.html                # Arquivo HTML base
│   └── favicon.ico
├── src/
│   ├── Player.js                 # Componente principal (reprodução)
│   ├── Player.css                # Estilos do player
│   ├── index.js                  # Ponto de entrada React
│   └── logo.svg
├── package.json
├── Dockerfile                     # Para containerização (opcional)
└── README.md
```

## Admin Panel (React)

```
admin-panel/
├── public/
│   ├── index.html                # Arquivo HTML base
│   └── favicon.ico
├── src/
│   ├── App.js                    # Componente raiz
│   ├── App.css                   # Estilos principais
│   ├── index.js                  # Ponto de entrada React
│   ├── index.css                 # Estilos globais
│   ├── pages/
│   │   ├── Login.js              # Página de login
│   │   ├── Login.css
│   │   ├── Dashboard.js          # Dashboard principal
│   │   ├── Dashboard.css
│   │   ├── Videos.js             # Gerenciamento de vídeos
│   │   ├── Videos.css
│   │   ├── Playlists.js          # Gerenciamento de playlists
│   │   ├── Playlists.css
│   │   ├── Displays.js           # Gerenciamento de displays
│   │   ├── Displays.css
│   │   ├── Settings.js           # Configurações
│   │   └── Settings.css
│   ├── components/               # Componentes reutilizáveis
│   └── services/                 # Serviços API
├── package.json
├── Dockerfile.prod               # Para produção (opcional)
└── README.md
```

## Raiz do Projeto

```
VS-Code_WnrMidia/
├── backend/                      # Servidor Node.js
├── frontend-player/              # Reprodutor Electron
├── admin-panel/                  # Painel React
├── .github/
│   └── copilot-instructions.md   # Instruções customizadas
├── .env.example                  # Template de variáveis
├── .gitignore
├── docker-compose.yml            # Orquestração de containers
├── README.md                      # Documentação principal
├── QUICKSTART.md                 # Guia rápido
├── ARCHITECTURE.md               # Este arquivo
├── setup.sh                       # Script setup (Linux/Mac)
├── setup.bat                      # Script setup (Windows)
└── .git/                          # Repositório Git
```

## Fluxo de Dados

### Reprodução de Vídeo

```
Admin Panel (React)
    ↓
Envia playlist para Backend (Express)
    ↓
Backend armazena em PostgreSQL
    ↓
WebSocket notifica Players (Electron)
    ↓
Players baixam cache local
    ↓
Vídeos reproduzem em loop
    ↓
Players reportam analytics
```

### Autenticação

```
Usuário faz login no Admin Panel
    ↓
Backend valida credenciais (bcrypt)
    ↓
Gera JWT token
    ↓
Admin Panel armazena em localStorage
    ↓
Todas as requisições incluem Bearer token
    ↓
Middleware valida cada request
```

### Comunicação em Tempo Real

```
Admin Panel muda playlist
    ↓
Backend emite evento via Socket.IO
    ↓
Player (Electron) recebe evento
    ↓
Player atualiza playlist local
    ↓
Próximo vídeo muda automaticamente
```

## Stack Tecnológico

### Backend
- **Runtime**: Node.js 14+
- **Framework**: Express 4.x
- **Database**: PostgreSQL 12+
- **ORM**: Knex.js
- **Autenticação**: JWT, Passport.js
- **2FA**: Speakeasy (TOTP)
- **Real-time**: Socket.IO
- **Upload**: Multer

### Frontend Player
- **Framework**: Electron 27+
- **UI**: React 18.x
- **HTTP**: Axios
- **Real-time**: Socket.io-client

### Admin Panel
- **Framework**: React 18.x
- **Roteamento**: React Router 6.x
- **HTTP**: Axios
- **Estado**: Zustand (opcional)
- **Notificações**: React Hot Toast
- **UI**: CSS customizado

## Segurança

- Senhas hashadas com bcryptjs
- JWT com expiração configurável
- 2FA TOTP para usuários
- OAuth2 integrado (Google, Microsoft)
- CORS configurado
- Validação de entrada (express-validator)
- Rate limiting (implementar depois)
- HTTPS em produção (reverse proxy)

## Performance

- Cache local nos displays
- Índices de database otimizados
- WebSocket para atualizações em tempo real (em vez de polling)
- CDN ready para vídeos
- Compressão gzip

## Escalabilidade

- Suporte para 10-100 displays (expansível)
- Database com índices apropriados
- Socket.IO com rooms por display
- Arquitetura pronta para load balancing
- Sem sessões em memória (stateless)

## Próximos Passos (Melhorias Futuras)

- [ ] Configurar HTTPS/SSL
- [ ] Implementar rate limiting
- [ ] Adicionar compressão de vídeos
- [ ] Dashboard de analytics detalhado
- [ ] Integração com CDN (CloudFront/Cloudflare)
- [ ] Agendamento de playlists
- [ ] Relatórios em PDF
- [ ] API GraphQL (alternativa para REST)
- [ ] Testes unitários/E2E
- [ ] CI/CD com GitHub Actions
