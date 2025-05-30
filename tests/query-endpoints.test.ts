import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/worker.js';
import { FakeD1Database } from './fake-db.js';
import { createSearch } from '../worker/db.js';

/** Verify popular and recent query endpoints. */
test('popular and recent queries', async () => {
  const db = new FakeD1Database();
  await createSearch(db as any, { query: 'foo' });
  await createSearch(db as any, { query: 'bar' });
  await createSearch(db as any, { query: 'foo' });

  const popularReq = new Request('http://localhost/api/popular-queries?limit=2');
  const popularRes = await worker.fetch(popularReq, { DB: db, OPENROUTER_API_KEY: 'k' });
  assert.strictEqual(popularRes.status, 200);
  const popular = await popularRes.json();
  assert.deepStrictEqual(popular, [
    { query: 'foo', count: 2 },
    { query: 'bar', count: 1 },
  ]);

  const recentReq = new Request('http://localhost/api/recent-queries?limit=2');
  const recentRes = await worker.fetch(recentReq, { DB: db, OPENROUTER_API_KEY: 'k' });
  assert.strictEqual(recentRes.status, 200);
  const recent = await recentRes.json();
  const queries = recent.map((r: any) => r.query);
  assert.ok(queries.includes('foo') && queries.includes('bar'));
});
