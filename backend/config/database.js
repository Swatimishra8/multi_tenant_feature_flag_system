const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('Initializing database connection...');

const dbPath = process.env.DB_PATH || './database.sqlite';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Create tables if they don't exist
const createTables = () => {
  console.log('Creating database tables...');
  
  // Organizations table
  db.run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT NOT NULL
    )
  `, (err) => {
    if (err) console.error('Error creating organizations table:', err);
    else console.log('Organizations table ready');
  });

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin', 'org_admin', 'end_user')),
      organization_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations (id)
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('Users table ready');
  });

  // Feature flags table
  db.run(`
    CREATE TABLE IF NOT EXISTS feature_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT 0,
      organization_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations (id),
      UNIQUE(key, organization_id)
    )
  `, (err) => {
    if (err) console.error('Error creating feature_flags table:', err);
    else console.log('Feature flags table ready');
  });
};

// Initialize tables
createTables();

module.exports = db;