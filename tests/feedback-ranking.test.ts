import { describe, it } from 'node:test';
import assert from 'node:assert';
import worker from '../worker/worker.js';
import { FakeD1Database } from './fake-db.js';
import { createUser, createSearch, createResult } from '../worker/db.js';
import crypto from 'node:crypto';

// Helper function to create test JWT token
function createTestToken(userId: number) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ userId })).toString('base64url');
  const secret = 'test-secret';
  const data = `${header}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

describe('Feedback System API Tests', () => {
  it('should submit user feedback via API', async () => {
    const db = new FakeD1Database();
    
    // Create test data
    const user = await createUser(db as any, {
      username: 'testuser',
      password: 'password123'
    });
    
    const search = await createSearch(db as any, {
      query: 'test query'
    });
    
    const result = await createResult(db as any, {
      searchId: search.id,
      modelId: 'test/model',
      content: 'test content',
      title: 'test title',
      responseTime: 1000
    });
    
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
      OPENROUTER_API_KEY: 'test-key',
      JWT_SECRET: 'test-secret'
    });
    
    assert.strictEqual(feedbackRes.status, 200);
    const feedbackData = await feedbackRes.json();
    assert.strictEqual(feedbackData.success, true);
    assert.ok(feedbackData.feedback);
  });

  it('should get trending models via API', async () => {
    const db = new FakeD1Database();
    
    const trendingReq = new Request('http://localhost/api/trending-models?period=day&limit=5');
    const trendingRes = await worker.fetch(trendingReq, { 
      DB: db, 
      OPENROUTER_API_KEY: 'test-key' 
    });
    
    assert.strictEqual(trendingRes.status, 200);
    const trending = await trendingRes.json();
    assert(Array.isArray(trending));
  });

  it('should get global leaderboard via API', async () => {
    const db = new FakeD1Database();
    
    // Test overall leaderboard
    const overallReq = new Request('http://localhost/api/leaderboard?type=overall&limit=10');
    const overallRes = await worker.fetch(overallReq, { 
      DB: db, 
      OPENROUTER_API_KEY: 'test-key' 
    });
    
    assert.strictEqual(overallRes.status, 200);
    const overall = await overallRes.json();
    assert(Array.isArray(overall));
  });

  it('should get personalized rankings for authenticated users', async () => {
    const db = new FakeD1Database();
    
    // Create test user
    const user = await createUser(db as any, {
      username: 'testuser',
      password: 'password123'
    });
    
    const token = createTestToken(user.id);
    
    const personalReq = new Request('http://localhost/api/personalized-rankings?limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const personalRes = await worker.fetch(personalReq, { 
      DB: db, 
      OPENROUTER_API_KEY: 'test-key',
      JWT_SECRET: 'test-secret'
    });
    
    assert.strictEqual(personalRes.status, 200);
    const personal = await personalRes.json();
    assert(Array.isArray(personal));
  });

  it('should allow anonymous feedback submission', async () => {
    const db = new FakeD1Database();
    
    const feedbackReq = new Request('http://localhost/api/submit-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resultId: 1,
        feedbackType: 'up'
      })
    });
    
    const feedbackRes = await worker.fetch(feedbackReq, { 
      DB: db, 
      OPENROUTER_API_KEY: 'test-key',
      JWT_SECRET: 'test-secret'
    });
    
    assert.strictEqual(feedbackRes.status, 200);
    const data = await feedbackRes.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.feedback);
  });

  it('should validate feedback type', async () => {
    const db = new FakeD1Database();
    
    const user = await createUser(db as any, {
      username: 'testuser',
      password: 'password123'
    });
    
    const token = createTestToken(user.id);
    
    const feedbackReq = new Request('http://localhost/api/submit-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        resultId: 1,
        feedbackType: 'invalid'
      })
    });
    
    const feedbackRes = await worker.fetch(feedbackReq, { 
      DB: db, 
      OPENROUTER_API_KEY: 'test-key',
      JWT_SECRET: 'test-secret'
    });
    
    assert.strictEqual(feedbackRes.status, 400);
  });
});