exports.up = async function(knex) {
  // Users table
  await knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('email').unique().notNullable();
    table.string('name').notNullable();
    table.string('password_hash');
    table.enum('role', ['admin', 'editor', 'viewer']).defaultTo('viewer');
    table.boolean('two_fa_enabled').defaultTo(false);
    table.string('two_fa_secret');
    table.string('google_id');
    table.string('microsoft_id');
    table.timestamps(true, true);
    table.index('email');
  });

  // Displays table
  await knex.schema.createTable('displays', table => {
    table.increments('id').primary();
    table.string('display_id').unique().notNullable();
    table.string('name').notNullable();
    table.enum('type', ['telao', 'outdoor', 'elevator', 'totem']).notNullable();
    table.string('location');
    table.float('width');
    table.float('height');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.enum('status', ['online', 'offline', 'maintenance']).defaultTo('offline');
    table.timestamp('last_sync').nullable();
    table.string('ip_address');
    table.string('hardware_info');
    table.timestamps(true, true);
    table.index('user_id');
    table.index('display_id');
  });

  // Videos table
  await knex.schema.createTable('videos', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.string('file_path').notNullable();
    table.float('duration').notNullable();
    table.integer('duration_seconds').notNullable();
    table.string('mime_type');
    table.integer('file_size');
    table.string('thumbnail_path');
    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.index('created_by');
  });

  // Playlists table
  await knex.schema.createTable('playlists', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.index('user_id');
  });

  // Playlist videos (many-to-many with order)
  await knex.schema.createTable('playlist_videos', table => {
    table.increments('id').primary();
    table.integer('playlist_id').unsigned().references('id').inTable('playlists').onDelete('CASCADE');
    table.integer('video_id').unsigned().references('id').inTable('videos').onDelete('CASCADE');
    table.integer('order').notNullable();
    table.timestamps(true, true);
    table.unique(['playlist_id', 'video_id']);
    table.index('playlist_id');
    table.index('video_id');
  });

  // Display playlists (many-to-many)
  await knex.schema.createTable('display_playlists', table => {
    table.increments('id').primary();
    table.integer('display_id').unsigned().references('id').inTable('displays').onDelete('CASCADE');
    table.integer('playlist_id').unsigned().references('id').inTable('playlists').onDelete('CASCADE');
    table.timestamp('scheduled_start');
    table.timestamp('scheduled_end');
    table.timestamps(true, true);
    table.unique(['display_id', 'playlist_id']);
    table.index('display_id');
    table.index('playlist_id');
  });

  // Analytics table
  await knex.schema.createTable('analytics', table => {
    table.increments('id').primary();
    table.integer('display_id').unsigned().references('id').inTable('displays').onDelete('CASCADE');
    table.integer('video_id').unsigned().references('id').inTable('videos').onDelete('SET NULL');
    table.integer('plays_count').defaultTo(0);
    table.float('watch_time_seconds').defaultTo(0);
    table.timestamp('last_played');
    table.timestamps(true, true);
    table.index('display_id');
    table.index('video_id');
  });

  // Sync logs for debugging
  await knex.schema.createTable('sync_logs', table => {
    table.increments('id').primary();
    table.integer('display_id').unsigned().references('id').inTable('displays').onDelete('CASCADE');
    table.string('action');
    table.text('details');
    table.enum('status', ['success', 'failed', 'pending']).defaultTo('pending');
    table.text('error_message');
    table.timestamps(true, true);
    table.index('display_id');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('sync_logs');
  await knex.schema.dropTableIfExists('analytics');
  await knex.schema.dropTableIfExists('display_playlists');
  await knex.schema.dropTableIfExists('playlist_videos');
  await knex.schema.dropTableIfExists('playlists');
  await knex.schema.dropTableIfExists('videos');
  await knex.schema.dropTableIfExists('displays');
  await knex.schema.dropTableIfExists('users');
};
