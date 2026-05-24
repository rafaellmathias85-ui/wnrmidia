#!/usr/bin/env node

/**
 * Script de verificação do projeto WnrMidia
 * Verifica se tudo está configurado corretamente
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, label) {
  const exists = fs.existsSync(filePath);
  const icon = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';
  log(`  ${icon} ${label}`, color);
  return exists;
}

function checkDirectory(dirPath, label) {
  const exists = fs.existsSync(dirPath);
  const icon = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';
  log(`  ${icon} ${label}`, color);
  return exists;
}

console.clear();
log('\n🔍 Verificação do Projeto WnrMidia\n', 'blue');

let allGood = true;

// Check directories
log('📁 Diretórios:', 'blue');
allGood &= checkDirectory('backend', 'Backend');
allGood &= checkDirectory('admin-panel', 'Admin Panel');
allGood &= checkDirectory('frontend-player', 'Frontend Player');
allGood &= checkDirectory('.github', 'GitHub config');

// Check main files
log('\n📄 Arquivos principais:', 'blue');
allGood &= checkFile('.env.example', '.env.example (configuração)');
allGood &= checkFile('README.md', 'README.md (documentação)');
allGood &= checkFile('QUICKSTART.md', 'QUICKSTART.md (guia rápido)');
allGood &= checkFile('ARCHITECTURE.md', 'ARCHITECTURE.md (arquitetura)');
allGood &= checkFile('DEVELOPMENT.md', 'DEVELOPMENT.md (desenvolvimento)');
allGood &= checkFile('ROADMAP.md', 'ROADMAP.md (roadmap)');
allGood &= checkFile('docker-compose.yml', 'docker-compose.yml');

// Check backend
log('\n🔧 Backend:', 'blue');
allGood &= checkFile('backend/package.json', 'package.json');
allGood &= checkFile('backend/src/server.js', 'server.js');
allGood &= checkFile('backend/src/routes/auth.js', 'routes/auth.js');
allGood &= checkFile('backend/src/routes/displays.js', 'routes/displays.js');
allGood &= checkFile('backend/src/routes/videos.js', 'routes/videos.js');
allGood &= checkFile('backend/src/routes/playlists.js', 'routes/playlists.js');
allGood &= checkFile('backend/migrations/001_create_tables.js', 'migrations');

// Check admin panel
log('\n⚛️  Admin Panel:', 'blue');
allGood &= checkFile('admin-panel/package.json', 'package.json');
allGood &= checkFile('admin-panel/src/App.js', 'App.js');
allGood &= checkFile('admin-panel/src/pages/Login.js', 'pages/Login.js');
allGood &= checkFile('admin-panel/src/pages/Dashboard.js', 'pages/Dashboard.js');
allGood &= checkFile('admin-panel/src/pages/Videos.js', 'pages/Videos.js');
allGood &= checkFile('admin-panel/src/pages/Playlists.js', 'pages/Playlists.js');
allGood &= checkFile('admin-panel/src/pages/Displays.js', 'pages/Displays.js');

// Check frontend player
log('\n🖥️  Frontend Player (Electron):', 'blue');
allGood &= checkFile('frontend-player/package.json', 'package.json');
allGood &= checkFile('frontend-player/public/main.js', 'public/main.js');
allGood &= checkFile('frontend-player/src/Player.js', 'src/Player.js');

// Check configuration
log('\n⚙️  Configuração:', 'blue');
const envExists = fs.existsSync('.env');
if (!envExists) {
  log('  ❌ .env não encontrado', 'red');
  log('     Use: cp .env.example .env', 'yellow');
  allGood = false;
} else {
  log('  ✅ .env (configurado)', 'green');
}

// Summary
log('\n' + '='.repeat(50), 'blue');
if (allGood) {
  log('✅ Tudo configurado corretamente!', 'green');
  log('\nPróximos passos:', 'blue');
  log('  1. Configurar .env (copie de .env.example)', 'yellow');
  log('  2. npm install (em cada pasta)', 'yellow');
  log('  3. bash setup.sh ou setup.bat', 'yellow');
  log('  4. npm run migrate (backend)', 'yellow');
  log('  5. bash start-dev.sh ou start-dev.bat', 'yellow');
} else {
  log('❌ Alguns arquivos estão faltando!', 'red');
  log('Verifique a estrutura do projeto.', 'yellow');
}
log('='.repeat(50) + '\n', 'blue');

process.exit(allGood ? 0 : 1);
