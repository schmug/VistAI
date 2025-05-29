import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/worker.js';
import { createSearch, createResult } from '../worker/db.js';
import { FakeD1Database } from './fake-db.js';

/**
 * Verify that the /api/track-click endpoint increments stats
 * and returns percentage and displayName fields.
 */
test('track-click updates model stats with percentages', async () => {
  const now = new Date().toISOString();
  const db = new FakeD1Database({
    'model/A': { clickCount: 1, searchCount: 1, updatedAt: now },
    'model/B': { clickCount: 1, searchCount: 1, updatedAt: now },
  });

  const search = await createSearch(db as any, { query: 'q' });
  await createResult(db as any, {
    searchId: search.id,
    modelId: 'model/A',
    content: 'A',
    title: 'A',
    responseTime: 5,
  });
  const resultB = await createResult(db as any, {
    searchId: search.id,
    modelId: 'model/B',
    content: 'B',
    title: 'B',
    responseTime: 5,
  });

  const req = new Request('http://localhost/api/track-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resultId: resultB.id }),
  });

  const res = await worker.fetch(req, { DB: db, OPENROUTER_API_KEY: 'key' });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.success);

  const a = data.stats.find((s: any) => s.modelId === 'model/A');
  const b = data.stats.find((s: any) => s.modelId === 'model/B');

  assert.strictEqual(a.clickCount, 1);
  assert.strictEqual(b.clickCount, 2);

  assert.strictEqual(a.percentage, 33);
  assert.strictEqual(b.percentage, 67);

  assert.strictEqual(a.displayName, 'A');
  assert.strictEqual(b.displayName, 'B');
});
