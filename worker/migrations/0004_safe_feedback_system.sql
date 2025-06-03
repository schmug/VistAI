-- Safe migration that creates additional feedback system components

-- Create feedback system tables with proper checks (user_id column already exists from previous migration)
CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  user_id INTEGER,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('up', 'down')),
  created_at TEXT NOT NULL,
  UNIQUE(result_id, user_id)
);

CREATE TABLE IF NOT EXISTS model_rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT NOT NULL,
  ranking_type TEXT NOT NULL CHECK (ranking_type IN ('overall', 'trending', 'personalized')),
  user_id INTEGER, -- NULL for global rankings, specific user for personalized
  score REAL NOT NULL DEFAULT 0,
  rank_position INTEGER NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(model_id, ranking_type, user_id, period_start)
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

-- Safe index creation (only create if they don't exist)
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

-- Indexes for new feedback tables
CREATE INDEX IF NOT EXISTS idx_user_feedback_result_id ON user_feedback(result_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_rankings_model_id ON model_rankings(model_id);
CREATE INDEX IF NOT EXISTS idx_model_rankings_type ON model_rankings(ranking_type);
CREATE INDEX IF NOT EXISTS idx_model_rankings_user_id ON model_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_model_rankings_score ON model_rankings(score DESC);
CREATE INDEX IF NOT EXISTS idx_model_rankings_rank ON model_rankings(rank_position);
CREATE INDEX IF NOT EXISTS idx_model_rankings_period ON model_rankings(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_trending_metrics_model_id ON trending_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_trending_metrics_period ON trending_metrics(time_period);
CREATE INDEX IF NOT EXISTS idx_trending_metrics_score ON trending_metrics(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_metrics_time ON trending_metrics(period_start, period_end);

-- Composite indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_model_rankings_type_score ON model_rankings(ranking_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_model_rankings_user_type ON model_rankings(user_id, ranking_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_metrics_period_score ON trending_metrics(time_period, trend_score DESC);