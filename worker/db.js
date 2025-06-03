import crypto from 'node:crypto';

/**
 * Hash a plain text password using PBKDF2 with SHA-256 and a random salt.
 * Returns a string in the format `salt:hash` where both values are hex encoded.
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 32, 'sha256')
    .toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plain text password against a stored `salt:hash` string.
 */
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashed = crypto
    .pbkdf2Sync(password, salt, 100000, 32, 'sha256')
    .toString('hex');
  return crypto.timingSafeEqual(
    Buffer.from(hashed, 'hex'),
    Buffer.from(hash, 'hex'),
  );
}

/**
 * Create a new user account in the database.
 * 
 * @param {Object} db - D1 database instance
 * @param {Object} userData - User data object
 * @param {string} userData.username - Unique username (3-50 characters)
 * @param {string} userData.password - Plain text password (will be hashed)
 * @returns {Promise<Object>} Created user object with id and username
 * @throws {Error} If username already exists or validation fails
 * 
 * @example
 * ```js
 * const user = await createUser(db, {
 *   username: "testuser",
 *   password: "securepassword123"
 * });
 * console.log(user); // { id: 1, username: "testuser" }
 * ```
 */
export async function createUser(db, { username, password }) {
  const hashed = hashPassword(password);
  const { results } = await db
    .prepare(
      'INSERT INTO users (username, password) VALUES (?, ?) RETURNING id, username'
    )
    .bind(username, hashed)
    .all();
  return results[0];
}

/**
 * Find a user by username for authentication.
 * 
 * @param {Object} db - D1 database instance
 * @param {string} username - Username to search for
 * @returns {Promise<Object|undefined>} User object with password hash, or undefined if not found
 * 
 * @example
 * ```js
 * const user = await findUser(db, "testuser");
 * if (user && hashPassword(inputPassword) === user.password) {
 *   // Authentication successful
 * }
 * ```
 */
export async function findUser(db, username) {
  const { results } = await db
    .prepare('SELECT id, username, password FROM users WHERE username = ?')
    .bind(username)
    .all();
  return results[0];
}

/**
 * Find a user by their unique ID (used for token validation).
 * 
 * @param {Object} db - D1 database instance
 * @param {number} id - User ID to search for
 * @returns {Promise<Object|undefined>} User object without password, or undefined if not found
 * 
 * @example
 * ```js
 * const user = await findUserById(db, 123);
 * if (user) {
 *   console.log(`Welcome back, ${user.username}!`);
 * }
 * ```
 */
export async function findUserById(db, id) {
  const { results } = await db
    .prepare('SELECT id, username FROM users WHERE id = ?')
    .bind(id)
    .all();
  return results[0];
}

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
export async function trackClick(db, { resultId, userId }) {
  const now = new Date().toISOString();
  const { results } = await db
    .prepare(
      'INSERT INTO clicks (result_id, user_id, created_at) VALUES (?,?,?) RETURNING id, result_id as resultId, user_id as userId, created_at as createdAt'
    )
    .bind(resultId, userId, now)
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

/**
 * Get the most frequently searched queries.
 */
export async function getPopularQueries(db, limit) {
  const { results } = await db
    .prepare(
      'SELECT query, COUNT(*) as count FROM searches GROUP BY query ORDER BY count DESC LIMIT ?'
    )
    .bind(limit)
    .all();
  return results.map((r) => ({ query: r.query, count: r.count }));
}

/**
 * Get the most recent search queries.
 */
export async function getRecentQueries(db, limit) {
  const { results } = await db
    .prepare(
      'SELECT query, created_at as createdAt FROM searches ORDER BY created_at DESC LIMIT ?'
    )
    .bind(limit)
    .all();
  return results;
}

/**
 * Submit user feedback (thumbs up/down) for a result.
 */
export async function submitUserFeedback(db, { resultId, userId, feedbackType }) {
  const now = new Date().toISOString();
  
  try {
    // For logged-in users, use INSERT OR REPLACE to allow updating their feedback
    // For anonymous users, always INSERT (allow multiple anonymous votes)
    let query, params;
    if (userId) {
      query = 'INSERT OR REPLACE INTO user_feedback (result_id, user_id, feedback_type, created_at) VALUES (?,?,?,?) RETURNING id, result_id as resultId, user_id as userId, feedback_type as feedbackType, created_at as createdAt';
      params = [resultId, userId, feedbackType, now];
    } else {
      query = 'INSERT INTO user_feedback (result_id, user_id, feedback_type, created_at) VALUES (?,?,?,?) RETURNING id, result_id as resultId, user_id as userId, feedback_type as feedbackType, created_at as createdAt';
      params = [resultId, null, feedbackType, now];
    }
    
    const { results } = await db.prepare(query).bind(...params).all();
    return results[0];
  } catch (error) {
    // If table doesn't exist, create a simple one and try again
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          result_id INTEGER NOT NULL,
          user_id INTEGER,
          feedback_type TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `).run();
      
      // Retry the insert after creating the table
      let query, params;
      if (userId) {
        query = 'INSERT OR REPLACE INTO user_feedback (result_id, user_id, feedback_type, created_at) VALUES (?,?,?,?) RETURNING id, result_id as resultId, user_id as userId, feedback_type as feedbackType, created_at as createdAt';
        params = [resultId, userId, feedbackType, now];
      } else {
        query = 'INSERT INTO user_feedback (result_id, user_id, feedback_type, created_at) VALUES (?,?,?,?) RETURNING id, result_id as resultId, user_id as userId, feedback_type as feedbackType, created_at as createdAt';
        params = [resultId, null, feedbackType, now];
      }
      
      const { results } = await db.prepare(query).bind(...params).all();
      return results[0];
    } catch (fallbackError) {
      console.error('Failed to submit feedback:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Get feedback stats for a specific result.
 */
export async function getResultFeedbackStats(db, resultId) {
  try {
    const { results } = await db
      .prepare(
        'SELECT feedback_type as feedbackType, COUNT(*) as count FROM user_feedback WHERE result_id = ? GROUP BY feedback_type'
      )
      .bind(resultId)
      .all();
    const stats = { up: 0, down: 0 };
    results.forEach(r => {
      stats[r.feedbackType] = r.count;
    });
    return stats;
  } catch (error) {
    // Return zero stats if user_feedback table doesn't exist
    return { up: 0, down: 0 };
  }
}

/**
 * Get user's feedback for a specific result.
 */
export async function getUserFeedback(db, resultId, userId) {
  if (!userId) return null;
  try {
    const { results } = await db
      .prepare(
        'SELECT feedback_type as feedbackType FROM user_feedback WHERE result_id = ? AND user_id = ?'
      )
      .bind(resultId, userId)
      .all();
    return results[0]?.feedbackType || null;
  } catch (error) {
    // Return null if user_feedback table doesn't exist
    return null;
  }
}

/**
 * Calculate and update trending metrics for all models.
 */
export async function updateTrendingMetrics(db, timePeriod = 'day') {
  const now = new Date();
  let periodStart, periodEnd;
  
  if (timePeriod === 'hour') {
    periodStart = new Date(now.getTime() - 60 * 60 * 1000);
    periodEnd = now;
  } else if (timePeriod === 'week') {
    periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    periodEnd = now;
  } else {
    periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    periodEnd = now;
  }
  
  const periodStartStr = periodStart.toISOString();
  const periodEndStr = periodEnd.toISOString();
  const nowStr = now.toISOString();

  // Ensure trending_metrics table exists
  try {
    await db.prepare(`
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
      )
    `).run();
  } catch (error) {
    console.warn('Could not create trending_metrics table:', error);
  }

  // Try to get data with feedback, fallback to simpler query if user_feedback table doesn't exist
  let modelData;
  try {
    const { results } = await db
      .prepare(`
        SELECT 
          r.model_id,
          COUNT(DISTINCT s.id) as total_searches,
          COUNT(DISTINCT c.id) as total_clicks,
          COALESCE(SUM(CASE WHEN uf.feedback_type = 'up' THEN 1 ELSE 0 END), 0) as positive_feedback,
          COALESCE(SUM(CASE WHEN uf.feedback_type = 'down' THEN 1 ELSE 0 END), 0) as negative_feedback
        FROM results r
        LEFT JOIN searches s ON r.search_id = s.id
        LEFT JOIN clicks c ON r.id = c.result_id
        LEFT JOIN user_feedback uf ON r.id = uf.result_id
        WHERE s.created_at >= ? AND s.created_at <= ?
        GROUP BY r.model_id
      `)
      .bind(periodStartStr, periodEndStr)
      .all();
    modelData = results;
  } catch (error) {
    // Fallback to simpler query without user_feedback
    const { results } = await db
      .prepare(`
        SELECT 
          r.model_id,
          COUNT(DISTINCT s.id) as total_searches,
          COUNT(DISTINCT c.id) as total_clicks,
          0 as positive_feedback,
          0 as negative_feedback
        FROM results r
        LEFT JOIN searches s ON r.search_id = s.id
        LEFT JOIN clicks c ON r.id = c.result_id
        WHERE s.created_at >= ? AND s.created_at <= ?
        GROUP BY r.model_id
      `)
      .bind(periodStartStr, periodEndStr)
      .all();
    modelData = results;
  }

  for (const model of modelData) {
    const totalInteractions = model.total_searches + model.total_clicks;
    const positiveRatio = totalInteractions > 0 ? model.positive_feedback / totalInteractions : 0;
    const negativeRatio = totalInteractions > 0 ? model.negative_feedback / totalInteractions : 0;
    const trendScore = (positiveRatio - negativeRatio) * Math.log(totalInteractions + 1);

    await db
      .prepare(
        'INSERT OR REPLACE INTO trending_metrics (model_id, time_period, positive_feedback, negative_feedback, total_searches, total_clicks, trend_score, period_start, period_end, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)'
      )
      .bind(
        model.model_id,
        timePeriod,
        model.positive_feedback,
        model.negative_feedback,
        model.total_searches,
        model.total_clicks,
        trendScore,
        periodStartStr,
        periodEndStr,
        nowStr
      )
      .run();
  }
}

/**
 * Get trending models based on recent performance.
 */
export async function getTrendingModels(db, timePeriod = 'day', limit = 10) {
  try {
    const { results } = await db
      .prepare(
        'SELECT model_id as modelId, trend_score as trendScore, positive_feedback as positiveFeedback, negative_feedback as negativeFeedback, total_searches as totalSearches, total_clicks as totalClicks, period_start as periodStart, period_end as periodEnd FROM trending_metrics WHERE time_period = ? ORDER BY trend_score DESC LIMIT ?'
      )
      .bind(timePeriod, limit)
      .all();
    
    return results.map(r => ({
      ...r,
      displayName: r.modelId.split('/').pop(),
      trending: r.trendScore > 0 ? 'up' : r.trendScore < 0 ? 'down' : 'stable'
    }));
  } catch (error) {
    // Return empty array if trending_metrics table doesn't exist yet
    console.warn('trending_metrics table not found, returning empty results');
    return [];
  }
}

/**
 * Calculate personalized rankings for a user based on their feedback history.
 */
export async function calculatePersonalizedRankings(db, userId, limit = 10) {
  try {
    const { results } = await db
      .prepare(`
        SELECT 
          r.model_id,
          COUNT(DISTINCT r.id) as total_results,
          COUNT(DISTINCT c.id) as user_clicks,
          COUNT(DISTINCT CASE WHEN uf.feedback_type = 'up' THEN uf.id END) as user_likes,
          COUNT(DISTINCT CASE WHEN uf.feedback_type = 'down' THEN uf.id END) as user_dislikes
        FROM results r
        LEFT JOIN clicks c ON r.id = c.result_id AND c.user_id = ?
        LEFT JOIN user_feedback uf ON r.id = uf.result_id AND uf.user_id = ?
        WHERE r.created_at >= datetime('now', '-30 days')
        GROUP BY r.model_id
        HAVING total_results > 0
        ORDER BY (user_likes * 2 + user_clicks - user_dislikes) DESC
        LIMIT ?
      `)
      .bind(userId, userId, limit)
      .all();

    return results.map((r, index) => ({
      modelId: r.model_id,
      displayName: r.model_id.split('/').pop(),
      rankPosition: index + 1,
      personalScore: (r.user_likes * 2 + r.user_clicks - r.user_dislikes),
      totalResults: r.total_results,
      userClicks: r.user_clicks,
      userLikes: r.user_likes,
      userDislikes: r.user_dislikes
    }));
  } catch (error) {
    // Fallback to click-based ranking if user_feedback table doesn't exist
    try {
      const { results } = await db
        .prepare(`
          SELECT 
            r.model_id,
            COUNT(DISTINCT r.id) as total_results,
            COUNT(DISTINCT c.id) as user_clicks,
            0 as user_likes,
            0 as user_dislikes
          FROM results r
          LEFT JOIN clicks c ON r.id = c.result_id AND c.user_id = ?
          WHERE r.created_at >= datetime('now', '-30 days')
          GROUP BY r.model_id
          HAVING total_results > 0
          ORDER BY user_clicks DESC
          LIMIT ?
        `)
        .bind(userId, limit)
        .all();

      return results.map((r, index) => ({
        modelId: r.model_id,
        displayName: r.model_id.split('/').pop(),
        rankPosition: index + 1,
        personalScore: r.user_clicks,
        totalResults: r.total_results,
        userClicks: r.user_clicks,
        userLikes: r.user_likes,
        userDislikes: r.user_dislikes
      }));
    } catch (fallbackError) {
      console.warn('Could not calculate personalized rankings:', fallbackError);
      return [];
    }
  }
}

/**
 * Get global leaderboard of models based on various metrics.
 */
export async function getGlobalLeaderboard(db, rankingType = 'overall', limit = 20) {
  try {
    let query;
    
    if (rankingType === 'overall') {
      // Try query with user_feedback first
      try {
        query = `
          SELECT 
            ms.model_id,
            ms.click_count,
            ms.search_count,
            COALESCE(feedback_stats.positive_feedback, 0) as positive_feedback,
            COALESCE(feedback_stats.negative_feedback, 0) as negative_feedback,
            (ms.click_count * 1.0 + COALESCE(feedback_stats.positive_feedback, 0) * 2.0 - COALESCE(feedback_stats.negative_feedback, 0) * 0.5) as overall_score
          FROM model_stats ms
          LEFT JOIN (
            SELECT 
              r.model_id,
              SUM(CASE WHEN uf.feedback_type = 'up' THEN 1 ELSE 0 END) as positive_feedback,
              SUM(CASE WHEN uf.feedback_type = 'down' THEN 1 ELSE 0 END) as negative_feedback
            FROM results r
            LEFT JOIN user_feedback uf ON r.id = uf.result_id
            GROUP BY r.model_id
          ) feedback_stats ON ms.model_id = feedback_stats.model_id
          ORDER BY overall_score DESC
          LIMIT ?
        `;
        const { results } = await db.prepare(query).bind(limit).all();
        return results.map((r, index) => ({
          ...r,
          modelId: r.model_id,
          displayName: r.model_id?.split('/').pop(),
          rankPosition: index + 1,
          score: r.overall_score || 0
        }));
      } catch (feedbackError) {
        // Fallback to simple model_stats query
        query = `
          SELECT 
            model_id,
            click_count,
            search_count,
            0 as positive_feedback,
            0 as negative_feedback,
            click_count as overall_score
          FROM model_stats
          ORDER BY click_count DESC
          LIMIT ?
        `;
        const { results } = await db.prepare(query).bind(limit).all();
        return results.map((r, index) => ({
          ...r,
          modelId: r.model_id,
          displayName: r.model_id?.split('/').pop(),
          rankPosition: index + 1,
          score: r.overall_score || 0
        }));
      }
    } else if (rankingType === 'trending') {
      query = `
        SELECT 
          model_id,
          trend_score,
          positive_feedback,
          negative_feedback,
          total_searches,
          total_clicks
        FROM trending_metrics 
        WHERE time_period = 'day'
        ORDER BY trend_score DESC
        LIMIT ?
      `;
      const { results } = await db.prepare(query).bind(limit).all();
      return results.map((r, index) => ({
        ...r,
        modelId: r.model_id,
        displayName: r.model_id?.split('/').pop(),
        rankPosition: index + 1,
        score: r.trend_score || 0
      }));
    }
  } catch (error) {
    console.warn('Error getting leaderboard:', error);
    return [];
  }
}
