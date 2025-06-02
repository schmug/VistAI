import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/worker.js';
import { FakeD1Database } from './fake-db.js';
import { createSearch, createUser, createResult } from '../worker/db.js';
import crypto from 'node:crypto';

/** Verify popular and recent query endpoints. */
test('popular and recent queries', async () => {
  const db = new FakeD1Database();
  
  // Create searches with slight delays to ensure different timestamps
  await createSearch(db as any, { query: 'foo' });
  await new Promise(resolve => setTimeout(resolve, 1)); // 1ms delay
  await createSearch(db as any, { query: 'bar' });
  await new Promise(resolve => setTimeout(resolve, 1)); // 1ms delay
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
  
  // Ensure we got exactly 2 results
  assert.strictEqual(recent.length, 2);
  
  // Extract queries and check they include both expected values
  const queries = recent.map((r: any) => r.query);
  assert.ok(queries.includes('foo') && queries.includes('bar'));
});

/** Test feedback submission endpoint. */
test('submit feedback endpoint', async () => {
  const db = new FakeD1Database();
  
  // Create test user, search, and result
  const user = await createUser(db as any, { username: 'testuser', password: 'password123' });
  const search = await createSearch(db as any, { query: 'test query' });
  const result = await createResult(db as any, {
    searchId: search.id,
    modelId: 'test/model',
    content: 'test content',
    title: 'test title',
    responseTime: 1000
  });
  
  // Create a simple JWT token for testing
  function createTestToken(userId: number) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ userId })).toString('base64url');
    const secret = 'test-secret';
    const data = `${header}.${payload}`;
    const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${sig}`;
  }
  
  const token = createTestToken(user.id);
  
  // Test submitting positive feedback
  const feedbackReq = new Request('http://localhost/api/submit-feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      resultId: result.id,
      feedbackType: 'up'
    })
  });
  
  const feedbackRes = await worker.fetch(feedbackReq, { 
    DB: db, 
    OPENROUTER_API_KEY: 'k',
    JWT_SECRET: 'test-secret'
  });
  
  assert.strictEqual(feedbackRes.status, 200);
  const feedbackData = await feedbackRes.json();
  assert.strictEqual(feedbackData.success, true);
  assert.ok(feedbackData.feedback);
});

/** Test trending models endpoint. */
test('trending models endpoint', async () => {
  const db = new FakeD1Database();
  
  const trendingReq = new Request('http://localhost/api/trending-models?period=day&limit=5');
  const trendingRes = await worker.fetch(trendingReq, { DB: db, OPENROUTER_API_KEY: 'k' });
  
  assert.strictEqual(trendingRes.status, 200);
  const trending = await trendingRes.json();
  assert(Array.isArray(trending));
});

/** Test leaderboard endpoint. */
test('leaderboard endpoint', async () => {
  const db = new FakeD1Database();
  
  // Test overall leaderboard
  const overallReq = new Request('http://localhost/api/leaderboard?type=overall&limit=10');
  const overallRes = await worker.fetch(overallReq, { DB: db, OPENROUTER_API_KEY: 'k' });
  
  assert.strictEqual(overallRes.status, 200);
  const overall = await overallRes.json();
  assert(Array.isArray(overall));
  
  // Test trending leaderboard
  const trendingReq = new Request('http://localhost/api/leaderboard?type=trending&limit=10');
  const trendingRes = await worker.fetch(trendingReq, { DB: db, OPENROUTER_API_KEY: 'k' });
  
  assert.strictEqual(trendingRes.status, 200);
  const trending = await trendingRes.json();
  assert(Array.isArray(trending));
});

/** Test personalized rankings endpoint (requires auth). */
test('personalized rankings endpoint', async () => {
  const db = new FakeD1Database();
  
  // Create test user
  const user = await createUser(db as any, { username: 'testuser', password: 'password123' });
  
  function createTestToken(userId: number) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ userId })).toString('base64url');
    const secret = 'test-secret';
    const data = `${header}.${payload}`;
    const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${sig}`;
  }
  
  const token = createTestToken(user.id);
  
  const personalReq = new Request('http://localhost/api/personalized-rankings?limit=10', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const personalRes = await worker.fetch(personalReq, { 
    DB: db, 
    OPENROUTER_API_KEY: 'k',
    JWT_SECRET: 'test-secret'
  });
  
  assert.strictEqual(personalRes.status, 200);
  const personal = await personalRes.json();
  assert(Array.isArray(personal));
});
