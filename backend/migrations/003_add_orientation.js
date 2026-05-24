exports.up = async function(knex) {
  await knex.schema.table('displays', table => {
    table.string('orientation').defaultTo('landscape');
  });
};

exports.down = async function(knex) {
  await knex.schema.table('displays', table => {
    table.dropColumn('orientation');
  });
};
