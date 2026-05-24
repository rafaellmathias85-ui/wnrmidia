#!/usr/bin/env node
// Uso: node create-user.js <email> <senha> <role>
// Exemplo: node create-user.js rafaellmathias85@gmail.com Winner@123 admin

const bcrypt = require('bcryptjs');
const path = require('path');

process.chdir(path.join(__dirname, '../backend'));
const db = require('./src/config/database');

const [,, email, password, role = 'admin'] = process.argv;

if (!email || !password) {
  console.error('Uso: node create-user.js <email> <senha> <role>');
  process.exit(1);
}

async function run() {
  try {
    const existing = await db('users').where('email', email).first();
    if (existing) {
      const hash = bcrypt.hashSync(password, 10);
      await db('users').where('email', email).update({
        password_hash: hash,
        role,
        updated_at: new Date().toISOString()
      });
      console.log(`Usuario atualizado: ${email} (${role})`);
    } else {
      await db('users').insert({
        email,
        name: email.split('@')[0],
        password_hash: bcrypt.hashSync(password, 10),
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log(`Usuario criado: ${email} (${role})`);
    }
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
