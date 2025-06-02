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
