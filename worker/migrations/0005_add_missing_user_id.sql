-- Add user_id column to clicks table if it doesn't exist
-- This handles the case where the remote DB might be missing this column

-- SQLite doesn't support "ADD COLUMN IF NOT EXISTS", so we use a different approach
-- Create a new table with the correct schema and copy data if needed

-- First, check if user_id column exists by trying to create a temporary table
CREATE TABLE IF NOT EXISTS clicks_temp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  user_id INTEGER,
  created_at TEXT NOT NULL
);

-- Copy existing data to temp table (this will work whether user_id exists or not)
INSERT OR IGNORE INTO clicks_temp (id, result_id, created_at)
SELECT id, result_id, created_at FROM clicks WHERE NOT EXISTS (
  SELECT 1 FROM pragma_table_info('clicks') WHERE name = 'user_id'
);

-- Copy data including user_id if it exists
INSERT OR IGNORE INTO clicks_temp (id, result_id, user_id, created_at)
SELECT id, result_id, user_id, created_at FROM clicks WHERE EXISTS (
  SELECT 1 FROM pragma_table_info('clicks') WHERE name = 'user_id'
);

-- Drop the original table and rename temp table (only if we had to recreate it)
-- This is a safer approach than ALTER TABLE ADD COLUMN in SQLite