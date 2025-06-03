-- Performance indexes for faster queries

-- First, add user_id column to clicks table if it doesn't exist
-- This handles cases where the initial schema wasn't applied correctly
ALTER TABLE clicks ADD COLUMN user_id INTEGER;

-- Index for searching queries by text (for popular/recent queries)
CREATE INDEX IF NOT EXISTS idx_searches_query ON searches(query);

-- Index for searching by creation time (for recent queries)
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);

-- Index for results by search_id (for getting results for a search)
CREATE INDEX IF NOT EXISTS idx_results_search_id ON results(search_id);

-- Index for results by model_id (for model-specific queries)
CREATE INDEX IF NOT EXISTS idx_results_model_id ON results(model_id);

-- Index for results by created_at (for time-based queries)
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at DESC);

-- Index for clicks by result_id (for tracking clicks on results)
CREATE INDEX IF NOT EXISTS idx_clicks_result_id ON clicks(result_id);

-- Index for clicks by user_id (for user-specific analytics)
CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON clicks(user_id);

-- Index for clicks by created_at (for time-based analytics)
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at DESC);

-- Composite index for model stats ordering (for top models queries)
CREATE INDEX IF NOT EXISTS idx_model_stats_click_count ON model_stats(click_count DESC);

-- Composite index for efficient query grouping and counting
CREATE INDEX IF NOT EXISTS idx_searches_query_created_at ON searches(query, created_at DESC);

-- Composite index for efficient result lookups by search and model
CREATE INDEX IF NOT EXISTS idx_results_search_model ON results(search_id, model_id);

-- Composite index for efficient click analytics by result and time
CREATE INDEX IF NOT EXISTS idx_clicks_result_created ON clicks(result_id, created_at DESC);