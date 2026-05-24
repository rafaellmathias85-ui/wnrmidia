# WnrMidia - Instruções Customizadas para Copilot

## Contexto do Projeto

WnrMidia é um sistema de gestão de displays de vídeo para telões, outdoors, monitores de elevador e totens. Composto por:

- **Backend**: Node.js + Express + PostgreSQL + Socket.IO
- **Frontend Player**: Electron + React (reprodutor de vídeos)
- **Admin Panel**: React (gestão de playlists, vídeos, displays)

## Convenções de Código

### JavaScript/Node.js
- Use `const` por padrão, `let` quando necessário
- Arrow functions para callbacks
- Async/await para operações assincrónas
- Comentários em Português (PT-BR)
- Nomes de variáveis em camelCase

### React
- Componentes funcionais com Hooks
- Props como objeto desestruturado
- CSS Modules ou CSS-in-JS quando apropriado
- Componentes em páginas/ para telas principais

### SQL/Knex.js
- Nomes de tabelas em snake_case (plural)
- Índices em colunas frecuentemente consultadas
- Migrations com rollback testado

## Estrutura de Rotas API

Todos os endpoints seguem padrão REST:
- `GET /api/resource` - Listar
- `POST /api/resource` - Criar
- `GET /api/resource/:id` - Obter um
- `PUT /api/resource/:id` - Atualizar
- `DELETE /api/resource/:id` - Deletar

Respostas sempre incluem:
- Status HTTP apropriado
- JSON com dados ou erro
- Mensagens de erro claras

## Autenticação

- JWT Bearer token no header `Authorization: Bearer <token>`
- Middleware `authMiddleware` valida em todas as rotas protegidas
- Roles: `admin`, `editor`, `viewer`
- 2FA opcional com TOTP

## WebSocket Events

Para sincronização em tempo real, usar Socket.IO com rooms:
- Room pattern: `display_{displayId}`
- Eventos: `playlist_updated`, `playlist_reordered`, etc.
- Backend emite, players recebem

## Quando Receber Requisições

### Para adicionar nova rota:
1. Criar arquivo em `backend/src/routes/novo.js`
2. Exportar router Express
3. Importar e registrar em `server.js`
4. Documentar em README.md

### Para modificar UI Admin Panel:
1. Editar componentes em `admin-panel/src/pages/`
2. Usar padrão de CSS fornecido
3. Componentes chamam API via axios

### Para alterações no Player:
1. Editar `frontend-player/src/Player.js`
2. Usar Electron IPC para comunicação
3. Testar no Electron dev mode

## Boas Práticas

- Sempre validar entrada (express-validator)
- Usar prepared statements (Knex)
- Hash de senhas com bcryptjs
- Variáveis sensíveis em .env
- Errors com status code apropriado
- Logs para debug
- Comentar código complexo

## Testing (Implementar Depois)

- Backend: Jest + Supertest
- Frontend: React Testing Library
- E2E: Cypress

## Deployment

- Docker Compose para desenvolvimento
- PostgreSQL em container separado
- Nginx como reverse proxy
- PM2 ou Docker em produção
- Variáveis .env por ambiente

## Próximas Prioridades

1. Implementar componentes faltantes
2. Testar fluxo completo
3. Adicionar rate limiting
4. Integrar com mais provedores OAuth
5. Criar tests automatizados

---

**Versão**: 1.0
**Última atualização**: 2024
