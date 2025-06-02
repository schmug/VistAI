-- Minimal feedback system migration
-- Creates only the essential tables for the feedback system

CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  user_id INTEGER,
  feedback_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trending_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT NOT NULL,
  time_period TEXT NOT NULL,
  positive_feedback INTEGER DEFAULT 0,
  negative_feedback INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  trend_score REAL DEFAULT 0,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_result ON user_feedback(result_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_trending_model ON trending_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_trending_score ON trending_metrics(trend_score DESC);