-- Add feedback system for thumbs up/down voting and ranking

-- User feedback on results (thumbs up/down)
CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  user_id INTEGER,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('up', 'down')),
  created_at TEXT NOT NULL,
  UNIQUE(result_id, user_id)
);

-- Model rankings based on various metrics
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

-- Trending analysis data
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

-- Indexes for performance
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