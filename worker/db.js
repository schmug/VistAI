/**
 * Insert a new search row and return the created record.
 */
export async function createSearch(db, { query }) {
  const now = new Date().toISOString();
  const { results } = await db
    .prepare(
      'INSERT INTO searches (query, created_at) VALUES (?, ?) RETURNING id, query, created_at'
    )
    .bind(query, now)
    .all();
  return results[0];
}

/**
 * Insert a model response associated with a search.
 */
export async function createResult(db, { searchId, modelId, content, title, responseTime }) {
  const now = new Date().toISOString();
  const { results } = await db
    .prepare(
      'INSERT INTO results (search_id, model_id, content, title, response_time, created_at) VALUES (?,?,?,?,?,?) RETURNING id, search_id as searchId, model_id as modelId, content, title, response_time as responseTime, created_at as createdAt'
    )
    .bind(searchId, modelId, content, title, responseTime, now)
    .all();
  return results[0];
}

/**
 * Record a user click on a result and update model stats.
 */
export async function trackClick(db, { resultId }) {
  const now = new Date().toISOString();
  const { results } = await db
    .prepare(
      'INSERT INTO clicks (result_id, created_at) VALUES (?, ?) RETURNING id, result_id as resultId, created_at as createdAt'
    )
    .bind(resultId, now)
    .all();
  await db
    .prepare(
      'UPDATE model_stats SET click_count = click_count + 1, updated_at = ? WHERE model_id = (SELECT model_id FROM results WHERE id = ?)' 
    )
    .bind(now, resultId)
    .run();
  return results[0];
}

/**
 * Increment the search count for a model, inserting if missing.
 */
export async function incrementModelSearches(db, modelId) {
  const now = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO model_stats (model_id, click_count, search_count, updated_at) VALUES (?,0,0,?) ON CONFLICT(model_id) DO NOTHING'
    )
    .bind(modelId, now)
    .run();
  await db
    .prepare(
      'UPDATE model_stats SET search_count = search_count + 1, updated_at = ? WHERE model_id = ?'
    )
    .bind(now, modelId)
    .run();
}

/**
 * Retrieve click and search counts for all models.
 */
export async function getModelStats(db) {
  const { results } = await db
    .prepare(
      'SELECT model_id as modelId, click_count as clickCount, search_count as searchCount, updated_at as updatedAt FROM model_stats'
    )
    .all();
  return results;
}

/**
 * Retrieve model stats with click percentage of total clicks.
 */
export async function getModelStatsWithPercent(db) {
  const stats = await getModelStats(db);
  const totalClicks = stats.reduce((sum, s) => sum + (s.clickCount || 0), 0);
  return stats.map((s) => ({
    ...s,
    percentage: totalClicks > 0 ? Math.round((s.clickCount / totalClicks) * 100) : 0,
    displayName: s.modelId.split('/').pop(),
  }));
}

/**
 * Get the top models sorted by clicks and include percentage values.
 */
export async function getTopModelsWithPercent(db, limit) {
  const { results } = await db
    .prepare(
      'SELECT model_id as modelId, click_count as clickCount, search_count as searchCount, updated_at as updatedAt FROM model_stats ORDER BY click_count DESC LIMIT ?'
    )
    .bind(limit)
    .all();
  const totalClicks = results.reduce((sum, s) => sum + (s.clickCount || 0), 0);
  return results.map((s) => ({
    ...s,
    percentage: totalClicks > 0 ? Math.round((s.clickCount / totalClicks) * 100) : 0,
    displayName: s.modelId.split('/').pop(),
  }));
}
