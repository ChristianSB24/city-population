const Database = require('better-sqlite3');

const db = new Database('database.db');

// Optimizations to the sqlite database
db.prepare('CREATE INDEX IF NOT EXISTS city_population ON cities (state, city)').run()
db.pragma('journal_mode = WAL')
db.pragma('synchronous = normal')
db.pragma('mmap_size = 30000000000')

module.exports = db

