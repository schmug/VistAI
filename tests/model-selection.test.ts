import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { FALLBACK_MODELS } from '../worker/worker.js';
import { FakeD1Database } from './fake-db.js';

test('uses DB top models when OpenRouter fails', async () => {
  const now = new Date().toISOString();
  const db = new FakeD1Database({
    [FALLBACK_MODELS[0]]: { clickCount: 5, searchCount: 10, updatedAt: now },
    [FALLBACK_MODELS[1]]: { clickCount: 3, searchCount: 8, updatedAt: now },
  });

  const originalFetch = global.fetch;
  global.fetch = async (url: any, opts: any) => {
    const u = url.toString();
    if (u.includes('/models/top') || u.includes('/models/trending')) {
      throw new Error('network');
    }
    // chat completions
    if (u.includes('/chat/completions')) {
      const body = JSON.parse(opts.body);
      const content = `resp for ${body.model}`;
      return new Response(
        JSON.stringify({ choices: [{ message: { content } }], usage: { total_ms: 1 } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    throw new Error('unexpected fetch ' + u);
  };

  const req = new Request('http://localhost/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'hello' }),
  });

  const res = await worker.fetch(req, { DB: db, OPENROUTER_API_KEY: 'key' });
  const data = await res.json();
  assert.deepStrictEqual(
    data.results.map((r: any) => r.modelId),
    [FALLBACK_MODELS[0], FALLBACK_MODELS[1]]
  );
  global.fetch = originalFetch;
});
