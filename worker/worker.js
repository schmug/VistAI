let warnedMissingKey = false;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // Basic CORS support with configurable origins
    const headers = createCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Root endpoint hint
    if (pathname === '/' && request.method === 'GET') {
      return jsonResponse({ message: 'Use /api/search or /api/status' }, headers);
    }

    // In-memory storage persisted across requests while worker is warm
    env.storage = env.storage || createStorage();

    try {
      if (pathname === '/api/status' && request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          apiKey: Boolean(env.OPENROUTER_API_KEY),
          time: new Date().toISOString(),
        }, headers);
      }

      if (pathname === '/api/search' && request.method === 'POST') {
        const body = await request.json();
        const { query } = body;
        if (!query) {
          return jsonResponse({ message: 'Invalid search query' }, headers, 400);
        }

        const search = env.storage.createSearch({ query });
        const models = [
          'openai/gpt-4',
          'anthropic/claude-2',
          'meta-llama/llama-2-70b-chat',
          'mistralai/mistral-7b-instruct',
        ];

        for (const m of models) {
          env.storage.incrementModelSearches(m);
        }

        const results = [];
        for (const modelId of models) {
          const modelResponse = await queryOpenRouter(query, modelId, env.OPENROUTER_API_KEY);
          const result = env.storage.createResult({
            searchId: search.id,
            modelId,
            content: modelResponse.content,
            title: modelResponse.title,
            responseTime: modelResponse.responseTime,
          });
          results.push({ ...result, modelName: modelId.split('/').pop() });
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
        const click = env.storage.trackClick({ resultId });
        const stats = env.storage.getModelStats();
        return jsonResponse({ success: true, click, stats }, headers);
      }

      if (pathname === '/api/model-stats' && request.method === 'GET') {
        const stats = env.storage.getModelStatsWithPercent();
        return jsonResponse(stats, headers);
      }

      if (pathname === '/api/top-models' && request.method === 'GET') {
        const limit = parseInt(searchParams.get('limit') || '5', 10);
        const stats = env.storage.getTopModelsWithPercent(limit);
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
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
  }

function createStorage() {
  let searchId = 1;
  let resultId = 1;
  let clickId = 1;
  const searches = new Map();
  const results = new Map();
  const modelStats = new Map();

  const defaultModels = [
    'openai/gpt-4',
    'anthropic/claude-2',
    'meta-llama/llama-2-70b-chat',
    'mistralai/mistral-7b-instruct',
  ];
  defaultModels.forEach((m) => {
    modelStats.set(m, { id: searchId++, modelId: m, clickCount: 0, searchCount: 0, updatedAt: new Date() });
  });

  return {
    createSearch({ query }) {
      const s = { id: searchId++, query, createdAt: new Date() };
      searches.set(s.id, s);
      return s;
    },
    createResult({ searchId, modelId, content, title, responseTime }) {
      const r = { id: resultId++, searchId, modelId, content, title, responseTime, createdAt: new Date() };
      results.set(r.id, r);
      return r;
    },
    trackClick({ resultId }) {
      const r = results.get(resultId);
      if (r) {
        const stat = modelStats.get(r.modelId);
        if (stat) {
          stat.clickCount += 1;
          stat.updatedAt = new Date();
        }
      }
      const c = { id: clickId++, resultId, createdAt: new Date() };
      return c;
    },
    incrementModelSearches(modelId) {
      const stat = modelStats.get(modelId);
      if (stat) {
        stat.searchCount += 1;
        stat.updatedAt = new Date();
      }
    },
    getModelStats() {
      return Array.from(modelStats.values());
    },
    getModelStatsWithPercent() {
      const stats = this.getModelStats();
      const totalClicks = stats.reduce((sum, s) => sum + s.clickCount, 0);
      return stats.map((s) => ({
        ...s,
        percentage: totalClicks > 0 ? Math.round((s.clickCount / totalClicks) * 100) : 0,
        displayName: s.modelId.split('/').pop(),
      }));
    },
    getTopModelsWithPercent(limit) {
      const stats = this.getModelStats()
        .sort((a, b) => b.clickCount - a.clickCount)
        .slice(0, limit);
      const totalClicks = stats.reduce((sum, s) => sum + s.clickCount, 0);
      return stats.map((s) => ({
        ...s,
        percentage: totalClicks > 0 ? Math.round((s.clickCount / totalClicks) * 100) : 0,
        displayName: s.modelId.split('/').pop(),
      }));
    },
  };
}

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
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`OpenRouter API error: ${resp.status} - ${txt}`);
    }
    const data = await resp.json();
    return {
      content: data.choices[0]?.message?.content || 'No response from model',
      title: extractTitle(data.choices[0]?.message?.content),
      responseTime: Math.round(data.usage?.total_ms || 0),
    };
  } catch (err) {
    return {
      content: `Error getting response from ${modelId}: ${err.message}`,
      title: `Error from ${modelId}`,
      responseTime: 0,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

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
