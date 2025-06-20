import {
  createSearch,
  createResult,
  trackClick,
  incrementModelSearches,
  getModelStatsWithPercent,
  getTopModelsWithPercent,
  getPopularQueries,
  getRecentQueries,
  createUser,
  findUser,
  findUserById,
  hashPassword,
  verifyPassword,
  submitUserFeedback,
  getResultFeedbackStats,
  getUserFeedback,
  updateTrendingMetrics,
  getTrendingModels,
  calculatePersonalizedRankings,
  getGlobalLeaderboard,
} from './db.js';
import crypto from 'node:crypto';

/**
 * Fallback model list used when dynamic fetch fails.
 */
export const FALLBACK_MODELS = [
  'google/gemini-2.5-pro-preview',
  'anthropic/claude-sonnet-4',
  'openai/gpt-4o-mini', 
  'deepseek/deepseek-r1-0528:free',
  'meta-llama/llama-3.3-8b-instruct:free',
];

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload, secret) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token, secret) {
  try {
    const [h, b, s] = token.split('.');
    if (!h || !b || !s) return null;
    const data = `${h}.${b}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64url');
    if (s !== expected) return null;
    return JSON.parse(Buffer.from(b, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function getTokenFromRequest(request) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.*)$/);
  if (m) return m[1];
  const cookie = request.headers.get('Cookie') || '';
  const ck = cookie.split(';').find((c) => c.trim().startsWith('token='));
  return ck ? ck.trim().slice('token='.length) : '';
}

function tokenCookie(token) {
  const week = 7 * 24 * 60 * 60;
  return `token=${token}; HttpOnly; Path=/; Max-Age=${week}`;
}

const openapiSpec = `openapi: 3.0.0
info:
  title: VistAI API
  version: '1.0.0'
components: {}
paths:
  /api/status:
    get:
      summary: Get API status
      responses:
        '200':
          description: Status information
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  apiKey:
                    type: boolean
                  db:
                    type: boolean
                  time:
                    type: string
  /api/register:
    post:
      summary: Register a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Registered
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    type: object
  /api/login:
    post:
      summary: Login and obtain auth cookie
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Login success
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    type: object
  /api/logout:
    post:
      summary: Clear authentication cookie
      responses:
        '200':
          description: Logout success
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
  /api/search:
    post:
      summary: Query models
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                query:
                  type: string
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
                type: object
                properties:
                  search:
                    type: object
                  results:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: integer
                        searchId:
                          type: integer
                        modelId:
                          type: string
                        snippet:
                          type: string
                        content:
                          type: string
                        title:
                          type: string
                        responseTime:
                          type: integer
                  totalTime:
                    type: integer
  /api/track-click:
    post:
      summary: Track a user click on a result
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                resultId:
                  type: integer
      responses:
        '200':
          description: Click tracked
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  click:
                    type: object
                  stats:
                    type: array
                    items:
                      type: object
                      properties:
                        modelId:
                          type: string
                        clickCount:
                          type: integer
                        searchCount:
                          type: integer
                        updatedAt:
                          type: string
                        percentage:
                          type: integer
                        displayName:
                          type: string
  /api/model-stats:
    get:
      summary: Get statistics for each model
      responses:
        '200':
          description: Model stats with percentages
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    modelId:
                      type: string
                    clickCount:
                      type: integer
                    searchCount:
                      type: integer
                    updatedAt:
                      type: string
                    percentage:
                      type: integer
                    displayName:
                      type: string
  /api/top-models:
    get:
      summary: Get top models by click count
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
          required: false
      responses:
        '200':
          description: Top models
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    modelId:
                      type: string
                    clickCount:
                      type: integer
                    searchCount:
                      type: integer
                    updatedAt:
                      type: string
                    percentage:
                      type: integer
                    displayName:
                      type: string
  /api/popular-queries:
    get:
      summary: Get most searched queries
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
          required: false
      responses:
        '200':
          description: Popular queries
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    query:
                      type: string
                    count:
                      type: integer
  /api/recent-queries:
    get:
      summary: Get recent search queries
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
          required: false
      responses:
        '200':
          description: Recent queries
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    query:
                      type: string
                    createdAt:
                      type: string
  /api/submit-feedback:
    post:
      summary: Submit thumbs up/down feedback for a result
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                resultId:
                  type: integer
                feedbackType:
                  type: string
                  enum: [up, down]
      responses:
        '200':
          description: Feedback submitted
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  feedback:
                    type: object
  /api/trending-models:
    get:
      summary: Get trending models based on recent performance
      parameters:
        - in: query
          name: period
          schema:
            type: string
            enum: [hour, day, week]
          required: false
        - in: query
          name: limit
          schema:
            type: integer
          required: false
      responses:
        '200':
          description: Trending models
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    modelId:
                      type: string
                    displayName:
                      type: string
                    trendScore:
                      type: number
                    trending:
                      type: string
  /api/personalized-rankings:
    get:
      summary: Get personalized model rankings for the current user
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
          required: false
      responses:
        '200':
          description: Personalized rankings
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    modelId:
                      type: string
                    displayName:
                      type: string
                    rankPosition:
                      type: integer
                    personalScore:
                      type: number
  /api/leaderboard:
    get:
      summary: Get global model leaderboard
      parameters:
        - in: query
          name: type
          schema:
            type: string
            enum: [overall, trending]
          required: false
        - in: query
          name: limit
          schema:
            type: integer
          required: false
      responses:
        '200':
          description: Model leaderboard
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    modelId:
                      type: string
                    displayName:
                      type: string
                    rankPosition:
                      type: integer
                    score:
                      type: number
`;

const swaggerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>VistAI API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
  <script>
  window.onload = () => {
    const ui = SwaggerUIBundle({
      url: '/api/openapi.yaml',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout'
    });
  };
  </script>
</body>
</html>`;

let warnedMissingKey = false;

/**
 * Cloudflare Worker entry with an HTTP fetch handler.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // Basic CORS support with configurable origins
    const headers = createCorsHeaders(request, env);

    const apiKey = env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return jsonResponse({ message: 'OPENROUTER_API_KEY is missing' }, headers, 500);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Root endpoint hint
    if (pathname === '/' && request.method === 'GET') {
      return jsonResponse({ message: 'Use /api/search or /api/status' }, headers);
    }

    // Swagger UI and OpenAPI spec
    if (pathname === '/docs' && request.method === 'GET') {
      return new Response(swaggerHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...headers },
      });
    }
    if (pathname === '/api/openapi.yaml' && request.method === 'GET') {
      return new Response(openapiSpec, {
        headers: { 'Content-Type': 'application/yaml', ...headers },
      });
    }

    if (!env.DB) {
      return jsonResponse({ message: 'Database binding DB is not configured' }, headers, 500);
    }

    try {
      if (pathname === '/api/status' && request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          time: new Date().toISOString(),
        }, headers);
      }

      if (pathname === '/api/register' && request.method === 'POST') {
        const body = await request.json();
        const { username, password } = body;
        // Enhanced password validation
        if (!username || !password) {
          return jsonResponse({ message: 'Username and password are required' }, headers, 400);
        }
        
        if (username.length < 3 || username.length > 50) {
          return jsonResponse({ message: 'Username must be 3-50 characters' }, headers, 400);
        }
        
        if (password.length < 12) {
          return jsonResponse({ message: 'Password must be at least 12 characters' }, headers, 400);
        }
        
        // Check password complexity
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChars) {
          return jsonResponse({ 
            message: 'Password must contain uppercase, lowercase, numbers, and special characters' 
          }, headers, 400);
        }
        const existing = await findUser(env.DB, username);
        if (existing) {
          return jsonResponse({ message: 'Username already exists' }, headers, 409);
        }
        const user = await createUser(env.DB, { username, password });
        const secret = env.JWT_SECRET;
        if (!secret) {
          return jsonResponse({ message: 'JWT_SECRET is not set' }, headers, 500);
        }
        const token = signToken({ userId: user.id }, secret);
        return jsonResponse(
          { user },
          { ...headers, 'Set-Cookie': tokenCookie(token) },
        );
      }

      if (pathname === '/api/login' && request.method === 'POST') {
        const body = await request.json();
        const { username, password } = body;
        if (!username || !password) {
          return jsonResponse({ message: 'Invalid credentials' }, headers, 400);
        }
        const user = await findUser(env.DB, username);
        if (!user || !verifyPassword(password, user.password)) {
          return jsonResponse({ message: 'Invalid credentials' }, headers, 401);
        }
        const secret = env.JWT_SECRET;
        if (!secret) {
          return jsonResponse({ message: 'JWT_SECRET is not set' }, headers, 500);
        }
        const token = signToken({ userId: user.id }, secret);
        return jsonResponse(
          { user: { id: user.id, username: user.username } },
          { ...headers, 'Set-Cookie': tokenCookie(token) },
        );
      }

      if (pathname === '/api/me' && request.method === 'GET') {
        const auth = request.headers.get('Authorization') || '';
        const m = auth.match(/^Bearer\s+(.*)$/);
        const token = m ? m[1] : '';
        const secret = env.JWT_SECRET;
        if (!secret) {
          return jsonResponse({ message: 'JWT_SECRET is not set' }, headers, 500);
        }
        const payload = verifyToken(token, secret);
        const userId = payload ? payload.userId : undefined;
        
        if (!userId) {
          return jsonResponse({ message: 'Invalid token' }, headers, 401);
        }

        const user = await findUserById(env.DB, userId);
        if (!user) {
          return jsonResponse({ message: 'User not found' }, headers, 404);
        }

        return jsonResponse({ id: user.id, username: user.username }, headers);
      }

      if (pathname === '/api/search' && request.method === 'POST') {
        const body = await request.json();
        const { query } = body;
        if (!query) {
          return jsonResponse({ message: 'Invalid search query' }, headers, 400);
        }

        const accept = request.headers.get('Accept') || '';
        const search = await createSearch(env.DB, { query });
        let models;
        try {
          const [top, trending] = await Promise.all([
            fetchTopModels(apiKey, 4),
            fetchTrendingModel(apiKey)
          ]);
          models = [...top];
          if (trending && !models.includes(trending)) {
            models.push(trending);
          }
        } catch (err) {
          console.warn('Failed to fetch models from OpenRouter', err);
          try {
            const stats = await getTopModelsWithPercent(env.DB, 4);
            const filtered = stats
              .map((s) => s.modelId)
              .filter((m) => FALLBACK_MODELS.includes(m));
            models = filtered.length > 0 ? filtered : [...FALLBACK_MODELS];
          } catch (dbErr) {
            console.warn('Failed to fetch models from DB', dbErr);
            models = [...FALLBACK_MODELS];
          }
        }

        await Promise.all(models.map(m => incrementModelSearches(env.DB, m)));

        if (accept.includes('text/event-stream')) {
          return streamSearchResponse({ query, search, models, env, headers, apiKey });
        }

        const modelPromises = models.map(async (modelId) => {
          const modelResponse = await queryOpenRouter(query, modelId, apiKey);
          const result = await createResult(env.DB, {
            searchId: search.id,
            modelId,
            content: modelResponse.content,
            title: modelResponse.title,
            responseTime: modelResponse.responseTime,
          });
          return {
            ...result,
            snippet: modelResponse.snippet,
            modelName: modelId.split('/').pop(),
          };
        });

        const results = await Promise.all(modelPromises);

        return jsonResponse({
          search,
          results,
          totalTime: Math.max(...results.map(r => r.responseTime || 0)),
        }, headers);
      }

      if (pathname === '/api/track-click' && request.method === 'POST') {
        const body = await request.json();
        const { resultId } = body;
        if (typeof resultId !== 'number') {
          return jsonResponse({ message: 'Invalid click data' }, headers, 400);
        }
        
        // Handle both authenticated and anonymous users
        let userId = null;
        const secret = env.JWT_SECRET;
        if (secret) {
          const token = getTokenFromRequest(request);
          const payload = verifyToken(token, secret);
          userId = payload ? payload.userId : null;
        }

        const click = await trackClick(env.DB, { resultId, userId });
        const stats = await getModelStatsWithPercent(env.DB);
        return jsonResponse({ success: true, click, stats }, headers);
      }

      if (pathname === '/api/logout' && request.method === 'POST') {
        return jsonResponse(
          { success: true },
          { ...headers, 'Set-Cookie': 'token=; Path=/; Max-Age=0; HttpOnly' },
        );
      }

      if (pathname === '/api/model-stats' && request.method === 'GET') {
        const stats = await getModelStatsWithPercent(env.DB);
        return jsonResponse(stats, headers);
      }

      if (pathname === '/api/top-models' && request.method === 'GET') {
        const limit = parseInt(searchParams.get('limit') || '5', 10);
        const stats = await getTopModelsWithPercent(env.DB, limit);
        return jsonResponse(stats, headers);
      }

      if (pathname === '/api/popular-queries' && request.method === 'GET') {
        const limit = parseInt(searchParams.get('limit') || '5', 10);
        const queries = await getPopularQueries(env.DB, limit);
        return jsonResponse(queries, headers);
      }

      if (pathname === '/api/recent-queries' && request.method === 'GET') {
        const limit = parseInt(searchParams.get('limit') || '5', 10);
        const queries = await getRecentQueries(env.DB, limit);
        return jsonResponse(queries, headers);
      }

      if (pathname === '/api/submit-feedback' && request.method === 'POST') {
        const body = await request.json();
        const { resultId, feedbackType } = body;
        if (typeof resultId !== 'number' || !['up', 'down'].includes(feedbackType)) {
          return jsonResponse({ message: 'Invalid feedback data' }, headers, 400);
        }
        
        // Handle both authenticated and anonymous users for feedback
        let userId = null;
        const secret = env.JWT_SECRET;
        if (secret) {
          const token = getTokenFromRequest(request);
          const payload = verifyToken(token, secret);
          userId = payload ? payload.userId : null;
        }

        // Anonymous users can still submit feedback (userId will be null)
        const feedback = await submitUserFeedback(env.DB, { resultId, userId, feedbackType });
        
        // Update trending metrics when feedback is submitted
        try {
          await updateTrendingMetrics(env.DB, 'day');
        } catch (err) {
          console.warn('Failed to update trending metrics:', err);
        }

        return jsonResponse({ success: true, feedback }, headers);
      }

      if (pathname === '/api/trending-models' && request.method === 'GET') {
        const period = searchParams.get('period') || 'day';
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        
        // Update trending metrics before fetching
        try {
          await updateTrendingMetrics(env.DB, period);
        } catch (err) {
          console.warn('Failed to update trending metrics:', err);
        }

        const models = await getTrendingModels(env.DB, period, limit);
        return jsonResponse(models, headers);
      }

      if (pathname === '/api/personalized-rankings' && request.method === 'GET') {
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const secret = env.JWT_SECRET;
        if (!secret) {
          return jsonResponse({ message: 'JWT_SECRET is not set' }, headers, 500);
        }
        const token = getTokenFromRequest(request);
        const payload = verifyToken(token, secret);
        const userId = payload ? payload.userId : null;

        if (!userId) {
          return jsonResponse({ message: 'Authentication required for personalized rankings' }, headers, 401);
        }

        const rankings = await calculatePersonalizedRankings(env.DB, userId, limit);
        return jsonResponse(rankings, headers);
      }

      if (pathname === '/api/leaderboard' && request.method === 'GET') {
        const type = searchParams.get('type') || 'overall';
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        
        if (!['overall', 'trending'].includes(type)) {
          return jsonResponse({ message: 'Invalid leaderboard type' }, headers, 400);
        }

        // Update trending metrics if requesting trending leaderboard
        if (type === 'trending') {
          try {
            await updateTrendingMetrics(env.DB, 'day');
          } catch (err) {
            console.warn('Failed to update trending metrics:', err);
          }
        }

        const leaderboard = await getGlobalLeaderboard(env.DB, type, limit);
        return jsonResponse(leaderboard, headers);
      }

      if (pathname === '/api/result-feedback' && request.method === 'GET') {
        const resultId = parseInt(searchParams.get('resultId') || '0', 10);
        if (!resultId) {
          return jsonResponse({ message: 'Invalid result ID' }, headers, 400);
        }
        
        // Get feedback stats
        const stats = await getResultFeedbackStats(env.DB, resultId);
        
        // Get user's feedback if authenticated
        let userFeedback = null;
        const secret = env.JWT_SECRET;
        if (secret) {
          const token = getTokenFromRequest(request);
          const payload = verifyToken(token, secret);
          const userId = payload ? payload.userId : null;
          if (userId) {
            userFeedback = await getUserFeedback(env.DB, resultId, userId);
          }
        }
        
        return jsonResponse({ stats, userFeedback }, headers);
      }

      return new Response('Not Found', { status: 404, headers });
    } catch (err) {
      return jsonResponse({ message: 'Internal Error' }, headers, 500);
    }
  }
  };

  function jsonResponse(data, headers, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  }

  function createCorsHeaders(request, env) {
    const cfg = env.ACCESS_CONTROL_ALLOW_ORIGIN || '';
    if (!cfg) {
      return {};
    }
    const allowed = cfg.split(',').map((o) => o.trim()).filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    let allow = allowed[0] || 'null';
    if (allowed.includes('*')) {
      allow = '*';
    } else if (origin && allowed.includes(origin)) {
      allow = origin;
    }
    return {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    };
  }

function streamSearchResponse({ query, search, models, env, headers, apiKey }) {
  const sseHeaders = {
    ...headers,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };
  const encoder = new TextEncoder();
  const results = [];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send('search', search);
        for (const modelId of models) {
          const modelResponse = await queryOpenRouter(query, modelId, apiKey);
          const result = await createResult(env.DB, {
            searchId: search.id,
            modelId,
            content: modelResponse.content,
            title: modelResponse.title,
            responseTime: modelResponse.responseTime,
          });
          const withName = {
            ...result,
            snippet: modelResponse.snippet,
            modelName: modelId.split('/').pop(),
          };
          results.push(withName);
          send('result', withName);
        }

        send('done', {
          search,
          results,
          totalTime: Math.max(...results.map(r => r.responseTime || 0)),
        });
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders });
}


/**
 * Send a prompt to OpenRouter with instructions to include a summary.
 * Returns the summary snippet, the main content and timing info.
 */
async function queryOpenRouter(prompt, modelId, apiKey) {
  try {
    if (!apiKey) {
      if (!warnedMissingKey) {
        console.warn('OPENROUTER_API_KEY is not set - returning error payload');
        warnedMissingKey = true;
      }
      return {
        content: `OpenRouter API key not configured`,
        title: `Error from ${modelId}`,
        responseTime: 0,
        error: 'OPENROUTER_API_KEY_MISSING'
      };
    }
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://vistai.example',
        'X-Title': 'VistAI Search Engine',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content:
              'Return a short one sentence summary wrapped in <summary></summary> tags before the full answer.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`OpenRouter API error: ${resp.status} - ${txt}`);
    }
    const data = await resp.json();
    const raw = data.choices[0]?.message?.content || 'No response from model';
    const { snippet, body } = extractSnippet(raw);
    return {
      content: body,
      snippet,
      title: extractTitle(body),
      responseTime: Math.round(data.usage?.total_ms || 0),
    };
  } catch (err) {
    return {
      content: `Error getting response from ${modelId}: ${err.message}`,
      snippet: '',
      title: `Error from ${modelId}`,
      responseTime: 0,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Attempt to extract a short title from model content.
 */
function extractTitle(content = '') {
  const match = content.match(/^#\s+(.*?)$|^Title:\s*(.*?)$|^(.*?)[\n\r]/m);
  if (match) {
    for (let i = 1; i < match.length; i++) {
      if (match[i]) return match[i].trim();
    }
  }
  const words = content.split(/\s+/).slice(0, 5).join(' ');
  return words + (words.length < content.length ? '...' : '');
}

export { extractTitle };

/**
 * Extract <summary> snippet from model output.
 * Returns the snippet and the remaining body text.
 */
function extractSnippet(content = '') {
  const match = content.match(/<summary>(.*?)<\/summary>\s*(.*)/s);
  if (match) {
    return { snippet: match[1].trim(), body: match[2].trim() };
  }
  return { snippet: '', body: content };
}

export { extractSnippet };

async function fetchTopModels(apiKey, limit = 4) {
  // Fetch all available models and select top performing ones
  const resp = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch models: ${resp.status}`);
  }
  const data = await resp.json();
  
  // Filter for high-quality, popular models that are likely to work well
  const popularModels = [
    'google/gemini-2.5-pro-preview',
    'anthropic/claude-sonnet-4', 
    'openai/gpt-4o-mini',
    'deepseek/deepseek-r1-0528:free',
    'google/gemini-2.5-flash-preview-05-20',
    'anthropic/claude-3.7-sonnet',
    'meta-llama/llama-3.3-8b-instruct:free'
  ];
  
  // Get available model IDs
  const availableModels = (data.data || []).map(m => m.id);
  
  // Return popular models that are actually available, up to the limit
  const validModels = popularModels.filter(model => availableModels.includes(model));
  return validModels.slice(0, limit);
}

async function fetchTrendingModel(apiKey) {
  // Get a high-performing model as "trending"
  const resp = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch models: ${resp.status}`);
  }
  const data = await resp.json();
  
  // Look for a good trending model - prioritize newer, high-performance models
  const trendingCandidates = [
    'deepseek/deepseek-r1-0528:free',
    'anthropic/claude-sonnet-4',
    'google/gemini-2.5-flash-preview-05-20',
    'mistralai/devstral-small:free'
  ];
  
  const availableModels = (data.data || []).map(m => m.id);
  const trending = trendingCandidates.find(model => availableModels.includes(model));
  
  return trending || '';
}