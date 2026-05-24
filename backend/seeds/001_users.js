const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  await knex('users').del();

  await knex('users').insert([
    {
      email: 'admin@wnrmidia.com',
      name: 'Administrador',
      password_hash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      email: 'editor@wnrmidia.com',
      name: 'Editor',
      password_hash: bcrypt.hashSync('editor123', 10),
      role: 'editor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
};
