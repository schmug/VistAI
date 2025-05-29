import {
  createSearch,
  createResult,
  trackClick,
  incrementModelSearches,
  getModelStatsWithPercent,
  getTopModelsWithPercent,
  createUser,
  findUser,
  hashPassword,
} from './db.js';

/**
 * Fallback model list used when dynamic fetch fails.
 */
export const FALLBACK_MODELS = [
  'google/gemini-2.0-flash-001',
  'openai/gpt-4o-mini',
  'anthropic/claude-3.7-sonnet',
  'google/gemini-2.5-pro-preview',
  'deepseek/deepseek-chat-v3-0324:free',
];

// Simple in-memory token store mapping tokens to user IDs
const tokenMap = new Map();

const openapiSpec = `openapi: 3.0.0
info:
  title: VistAI API
  version: '1.0.0'
components:
  securitySchemes:
    openrouter_api_key:
      type: apiKey
      in: header
      name: openrouter_api_key
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
                  token:
                    type: string
                  user:
                    type: object
  /api/login:
    post:
      summary: Login and obtain auth token
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
                  token:
                    type: string
                  user:
                    type: object
  /api/search:
    post:
      summary: Query models
      security:
        - openrouter_api_key: []
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
`;

const swaggerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>VistAI API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
  <div style="margin:10px">
    OpenRouter API Key:
    <input id="or-key" type="text" style="width:300px" />
    <button onclick="setKey()">Set</button>
  </div>
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
    const stored = localStorage.getItem('openrouter_api_key');
    if (stored) {
      ui.preauthorizeApiKey('openrouter_api_key', stored);
      document.getElementById('or-key').value = stored;
    }
    window.setKey = () => {
      const k = document.getElementById('or-key').value;
      if (k) {
        localStorage.setItem('openrouter_api_key', k);
        ui.preauthorizeApiKey('openrouter_api_key', k);
      }
    };
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

    const requestApiKey = request.headers.get('openrouter_api_key');
    const apiKey = requestApiKey || env.OPENROUTER_API_KEY;

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
          apiKey: Boolean(apiKey),
          db: Boolean(env.DB),
          time: new Date().toISOString(),
        }, headers);
      }

      if (pathname === '/api/register' && request.method === 'POST') {
        const body = await request.json();
        const { username, password } = body;
        if (!username || !password) {
          return jsonResponse({ message: 'Invalid user data' }, headers, 400);
        }
        const user = await createUser(env.DB, { username, password });
        const token = crypto.randomUUID();
        tokenMap.set(token, user.id);
        return jsonResponse({ token, user }, headers);
      }

      if (pathname === '/api/login' && request.method === 'POST') {
        const body = await request.json();
        const { username, password } = body;
        if (!username || !password) {
          return jsonResponse({ message: 'Invalid credentials' }, headers, 400);
        }
        const user = await findUser(env.DB, username);
        if (!user || hashPassword(password) !== user.password) {
          return jsonResponse({ message: 'Invalid credentials' }, headers, 401);
        }
        const token = crypto.randomUUID();
        tokenMap.set(token, user.id);
        return jsonResponse({ token, user: { id: user.id, username: user.username } }, headers);
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
          const top = await fetchTopModels(apiKey, 4);
          const trending = await fetchTrendingModel(apiKey);
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

        for (const m of models) {
          await incrementModelSearches(env.DB, m);
        }

        if (accept.includes('text/event-stream')) {
          return streamSearchResponse({ query, search, models, env, headers, apiKey });
        }

        const results = [];
        for (const modelId of models) {
          const modelResponse = await queryOpenRouter(
            query,
            modelId,
            apiKey
          );

          const result = await createResult(env.DB, {
            searchId: search.id,
            modelId,
            content: modelResponse.content,
            title: modelResponse.title,
            responseTime: modelResponse.responseTime,
          });
          results.push({
            ...result,
            snippet: modelResponse.snippet,
            modelName: modelId.split('/').pop(),
          });
        }

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
        const auth = request.headers.get('Authorization') || '';
        const m = auth.match(/^Bearer\s+(.*)$/);
        const token = m ? m[1] : '';
        const userId = tokenMap.get(token);

        const click = await trackClick(env.DB, { resultId, userId });
        const stats = await getModelStatsWithPercent(env.DB);
        return jsonResponse({ success: true, click, stats }, headers);
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
    const cfg = env.ACCESS_CONTROL_ALLOW_ORIGIN || '*';
    const allowed = cfg.split(',').map((o) => o.trim()).filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    let allow = '*';
    if (!allowed.includes('*')) {
      if (origin && allowed.includes(origin)) {
        allow = origin;
      } else {
        allow = allowed[0] || 'null';
      }
    }
    return {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, openrouter_api_key',
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
        'HTTP-Referer': 'https://aisearch.example',
        'X-Title': 'AI Search Engine',
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
  const resp = await fetch(`https://openrouter.ai/api/v1/models/top?limit=${limit}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch top models: ${resp.status}`);
  }
  const data = await resp.json();
  return (data.data || []).map((m) => m.id);
}

async function fetchTrendingModel(apiKey) {
  const resp = await fetch('https://openrouter.ai/api/v1/models/trending?limit=1', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch trending model: ${resp.status}`);
  }
  const data = await resp.json();
  return data.data && data.data[0] ? data.data[0].id : '';
}
