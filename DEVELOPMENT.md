# Dicas e Padrões de Desenvolvimento - WnrMidia

## 🎯 Convenções do Projeto

### Nomenclatura

**Arquivos e Pastas**
- Routes: `nomes-plurais` (ex: `displays.js`, `videos.js`)
- Componentes React: `PascalCase` (ex: `LoginPage.js`)
- Funções utilitárias: `camelCase` (ex: `formatDate()`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `MAX_VIDEO_SIZE`)

**Banco de Dados**
- Tabelas: `snake_case` plural (ex: `users`, `video_playlists`)
- Colunas: `snake_case` (ex: `created_at`, `display_id`)
- Foreign keys: `{tabela_singular}_id` (ex: `user_id`)

### Padrões de Código

**Backend (Express)**
```javascript
// Rota padrão
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Lógica aqui
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Frontend (React)**
```javascript
// Componente padrão
const MeuComponente = ({ prop1, prop2 }) => {
  const [state, setState] = React.useState(null);

  React.useEffect(() => {
    // Efeito aqui
  }, []);

  return (
    <div>Conteúdo</div>
  );
};
```

## 📝 Documentação

### README de cada pasta
- Instruções de instalação
- Como executar localmente
- Estrutura de arquivos
- Comandos disponíveis

### Comentários no código
- Explicar o "por quê", não o "quê"
- Comentar lógica complexa apenas
- Evitar comentários óbvios

## 🔐 Segurança

### Checklist de Segurança
- [ ] Entrada validada com express-validator
- [ ] Senhas hashadas (bcryptjs)
- [ ] JWT com expiração
- [ ] Prepared statements (Knex)
- [ ] CORS configurado
- [ ] Erro sem detalhes sensíveis
- [ ] Rate limiting (futura)

### Variáveis Sensíveis
NUNCA commit em código:
- Senhas de banco
- JWT_SECRET
- Keys de OAuth
- API keys

Usar `.env` e `.gitignore`

## 🧪 Testing

### Backend
```bash
# Instalar
npm install --save-dev jest supertest

# Test file: `test/auth.test.js`
describe('Auth Routes', () => {
  it('should login user', async () => {
    // teste aqui
  });
});
```

### Frontend
```bash
# Instalar
npm install --save-dev @testing-library/react

# Test file: `src/__tests__/LoginPage.test.js`
describe('LoginPage', () => {
  it('should render login form', () => {
    // teste aqui
  });
});
```

## 🚀 Deployment

### Variáveis por Ambiente

**.env.development**
```
NODE_ENV=development
DEBUG=true
```

**.env.production**
```
NODE_ENV=production
DEBUG=false
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

## 📊 Performance

### Backend
- Índices no banco em colunas frequentes
- Queries otimizadas (evitar N+1)
- Cache com Redis (futura)
- Gzip compression

### Frontend
- Code splitting em rotas
- Lazy loading de componentes
- Minify em produção
- Imagens otimizadas

## 🐛 Debugging

### Backend
```javascript
console.log('[DEBUG]', variavel); // Desenvolvimento
// Usar logger biblioteca em produção
```

### Frontend
```javascript
console.log('[Component]', props); // React DevTools
```

### Database
```sql
-- Explicar query
EXPLAIN ANALYZE SELECT * FROM displays WHERE status = 'online';
```

## 📦 Git Workflow

```bash
# Feature branch
git checkout -b feature/novo-componente

# Commit message
git commit -m "feat: adiciona novo componente"

# Tipos de commit
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Documentação
style:    Formatação
refactor: Refatoração
test:     Testes
chore:    Build, deps
```

## 🔄 CI/CD (Setup Futuro)

### GitHub Actions
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## 📚 Recursos Úteis

- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Knex.js Docs](https://knexjs.org/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Electron Docs](https://www.electronjs.org/docs)

## ⚡ Quick Commands

```bash
# Backend
npm run dev              # Desenvolvimento
npm run migrate          # Rodar migrations
npm test                 # Tests (quando tiver)

# Admin Panel
npm start                # Dev server
npm run build            # Build produção
npm test                 # Tests

# Player
npm run dev              # Dev com Electron
npm run build            # Build distribuível
```

## 🎓 Learning Resources

- Estrutura REST: https://restfulapi.net/
- JWT: https://jwt.io/introduction
- OAuth2: https://oauth.net/2/
- WebSocket: https://socket.io/docs/v4/
- PostgreSQL: https://www.postgresql.org/docs/

---

**Última atualização**: 2024
**Contributor**: WnrMidia Team
