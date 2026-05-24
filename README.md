# WnrMidia - Sistema de Gestão de Displays de Vídeo

Um sistema completo e escalável para gerenciar displays digitais com reprodução de vídeos rotativos. Ideal para telões, outdoors, monitores de elevador e totens.

## Características

✅ **Gerenciamento remoto de displays** - Controle até 100+ displays em tempo real
✅ **Reprodução de vídeos rotativos** - Suporte para vídeos de 10-20 segundos
✅ **Painel administrativo web** - Interface intuitiva e responsiva
✅ **Autenticação avançada** - Suporte para 2FA, SSO, OAuth2
✅ **Sincronização em tempo real** - WebSocket para atualizações instantâneas
✅ **Playlists dinâmicas** - Crie e reordene playlists remotamente
✅ **Analytics** - Rastreie reproduções e tempo de visualização
✅ **Sistema de cache híbrido** - Armazenamento local + servidor

## Arquitetura

```
WnrMidia/
├── backend/                    # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── controllers/        # Lógica de negócio
│   │   ├── middleware/         # Autenticação e validação
│   │   ├── services/           # Serviços auxiliares
│   │   └── config/             # Configurações
│   ├── migrations/             # Database migrations
│   └── package.json
│
├── frontend-player/            # Reprodutor Electron
│   ├── public/
│   │   ├── main.js            # Processo principal Electron
│   │   └── preload.js         # API entre processo
│   ├── src/
│   │   ├── Player.js          # Componente principal
│   │   └── Player.css
│   └── package.json
│
└── admin-panel/               # Painel administrativo React
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── services/
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Requisitos

- **Node.js** >= 14.0
- **PostgreSQL** >= 12
- **npm** ou **yarn**

## Instalação Rápida

### 1. Configurar Banco de Dados

```bash
# Criar banco de dados
createdb wnrmidia

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas credenciais PostgreSQL
```

### 2. Instalar Backend

```bash
cd backend
npm install

# Rodar migrations
npm run migrate

# Iniciar servidor (desenvolvimento)
npm run dev

# Produção
npm start
```

Server rodará em `http://localhost:5000`

### 3. Instalar Admin Panel

```bash
cd admin-panel
npm install
npm start
```

Painel rodará em `http://localhost:3000`

### 4. Instalar Player (Electron)

```bash
cd frontend-player
npm install

# Desenvolvimento
npm run dev

# Build distribuível
npm run build
```

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/2fa/setup` - Configurar 2FA
- `POST /api/auth/2fa/verify` - Verificar token 2FA

### Displays
- `GET /api/displays` - Listar displays
- `POST /api/displays` - Criar display
- `PUT /api/displays/:id` - Atualizar display
- `DELETE /api/displays/:id` - Deletar display
- `POST /api/displays/:id/playlist` - Atribuir playlist

### Vídeos
- `GET /api/videos` - Listar vídeos
- `POST /api/videos/upload` - Upload de vídeo
- `PUT /api/videos/:id` - Atualizar vídeo
- `DELETE /api/videos/:id` - Deletar vídeo

### Playlists
- `GET /api/playlists` - Listar playlists
- `POST /api/playlists` - Criar playlist
- `POST /api/playlists/:id/videos` - Adicionar vídeo
- `PUT /api/playlists/:id/reorder` - Reordenar vídeos
- `DELETE /api/playlists/:id/videos/:videoId` - Remover vídeo

### Analytics
- `POST /api/analytics/play` - Registrar reprodução
- `GET /api/analytics/display/:displayId` - Estatísticas do display

## Fluxo de Uso

### Para Administrador:

1. **Login** no painel admin
2. **Upload de Vídeos** (10-20 segundos cada)
3. **Criar Playlists** e adicionar vídeos
4. **Registrar Displays** (telão, outdoor, elevador, totem)
5. **Atribuir Playlists** aos displays
6. **Monitorar** displays online/offline em tempo real
7. **Visualizar Analytics** de reprodução

### Para Display (Reprodutor):

1. Registra-se automaticamente na primeira execução
2. Conecta ao WebSocket para receber atualizações
3. Baixa cache local da playlist
4. Reproduz vídeos em loop
5. Reporta métrica de reprodução ao backend

## Autenticação & Segurança

### Dois Fatores (2FA)
- TOTP (Time-based One-Time Password)
- QR Code para escanear em app autenticador
- Fallback por código de backup

### SSO (Single Sign-On)
- Google OAuth 2.0
- Microsoft OAuth 2.0
- LDAP (opcional)

### Permissões (RBAC)
- **Admin** - Acesso total
- **Editor** - Gerenciar vídeos e playlists
- **Viewer** - Apenas visualização

## Variáveis de Ambiente

Veja `.env.example` para referência completa:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/wnrmidia
JWT_SECRET=sua_chave_secreta_aqui
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
```

## WebSocket Events

### Cliente → Servidor
- `register_display` - Registrar novo display
- `sync_request` - Solicitar sincronização

### Servidor → Cliente
- `playlist_updated` - Playlist foi atualizada
- `playlist_reordered` - Ordem dos vídeos mudou
- `playlist_changed` - Vídeo foi adicionado/removido
- `display_updated` - Configurações do display mudaram

## Performance & Escalabilidade

- **Cache Local** - Vídeos em cache nos displays
- **CDN Ready** - Integração com CloudFront/Cloudflare
- **Database Indexing** - Queries otimizadas
- **Socket.IO Rooms** - Broadcast eficiente para displays
- **Load Balancing** - Suporta múltiplas instâncias backend

## Deployment

### Docker (Recomendado)

```bash
docker-compose up -d
```

### Manual

1. Instalar Node.js 14+
2. Instalar PostgreSQL
3. Clonar repositório
4. Rodar instalações conforme acima
5. Configurar reverse proxy (Nginx)

## Troubleshooting

### Display offline
- Verificar conexão de rede
- Revisar firewall
- Confirmar WebSocket na porta 5000

### Vídeos não reproduzem
- Verificar formato (MP4 recomendado)
- Confirmar duração (10-20s)
- Verificar espaço em disco

### 2FA não funciona
- Sincronizar hora do servidor
- Regenerar QR code
- Usar código de backup

## Suporte

- 📧 Email: suporte@wnrmidia.com
- 📖 Documentação: https://docs.wnrmidia.com
- 🐛 Issues: GitHub Issues

## Licença

MIT License - Veja LICENSE.md

---

**Desenvolvido com ❤️ para WnrMidia**
