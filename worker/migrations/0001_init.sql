CREATE TABLE IF NOT EXISTS searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_id INTEGER NOT NULL,
  model_id TEXT NOT NULL,
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  response_time INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  user_id INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_stats (
  model_id TEXT PRIMARY KEY,
  click_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);
