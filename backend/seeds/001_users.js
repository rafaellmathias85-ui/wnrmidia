const bcrypt = require('bcryptjs');

const DEFAULT_USERS = [
  {
    email: 'admin@wnrmidia.com',
    name: 'Administrador',
    password: 'admin123',
    role: 'admin',
  },
  {
    email: 'rafaellmathias85@gmail.com',
    name: 'Rafael Mathias',
    password: 'Winner@123',
    role: 'admin',
  },
];

exports.seed = async function(knex) {
  for (const user of DEFAULT_USERS) {
    const existing = await knex('users').where('email', user.email).first();
    if (!existing) {
      await knex('users').insert({
        email: user.email,
        name: user.name,
        password_hash: bcrypt.hashSync(user.password, 10),
        role: user.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }
};
