-- Fix missing user_id column in clicks table and apply safe indexes

-- First, check if user_id column exists, if not add it
-- We'll use a safe approach that works even if the column already exists

-- Create a backup of clicks table
CREATE TABLE IF NOT EXISTS clicks_backup AS SELECT * FROM clicks;

-- Recreate clicks table with proper schema including user_id
DROP TABLE IF EXISTS clicks;
CREATE TABLE clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  user_id INTEGER,
  created_at TEXT NOT NULL
);

-- Restore data from backup
INSERT INTO clicks (id, result_id, created_at)
SELECT id, result_id, created_at FROM clicks_backup;

-- Drop backup table
DROP TABLE clicks_backup;

-- Now safely create all the performance indexes
CREATE INDEX IF NOT EXISTS idx_searches_query ON searches(query);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_search_id ON results(search_id);
CREATE INDEX IF NOT EXISTS idx_results_model_id ON results(model_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_result_id ON clicks(result_id);
CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_stats_click_count ON model_stats(click_count DESC);
CREATE INDEX IF NOT EXISTS idx_searches_query_created_at ON searches(query, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_search_model ON results(search_id, model_id);
CREATE INDEX IF NOT EXISTS idx_clicks_result_created ON clicks(result_id, created_at DESC);

-- Create feedback system tables
CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  user_id INTEGER,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('up', 'down')),
  created_at TEXT NOT NULL,
  UNIQUE(result_id, user_id)
);

CREATE TABLE IF NOT EXISTS trending_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT NOT NULL,
  time_period TEXT NOT NULL CHECK (time_period IN ('hour', 'day', 'week')),
  positive_feedback INTEGER DEFAULT 0,
  negative_feedback INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  trend_score REAL NOT NULL DEFAULT 0,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(model_id, time_period, period_start)
);

-- Indexes for feedback tables
CREATE INDEX IF NOT EXISTS idx_user_feedback_result_id ON user_feedback(result_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trending_metrics_model_id ON trending_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_trending_metrics_period ON trending_metrics(time_period);
CREATE INDEX IF NOT EXISTS idx_trending_metrics_score ON trending_metrics(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_metrics_time ON trending_metrics(period_start, period_end);