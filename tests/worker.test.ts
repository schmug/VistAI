import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, extractTitle } from '../worker/worker.js';

test('createStorage tracks searches and clicks', () => {
  const storage = createStorage();
  const search = storage.createSearch({ query: 'hello' });
  const result = storage.createResult({ searchId: search.id, modelId: 'openai/gpt-4', content: 'hi', title: 't', responseTime: 1 });
  storage.incrementModelSearches('openai/gpt-4');
  storage.trackClick({ resultId: result.id });
  const stats = storage.getModelStats().find(s => s.modelId === 'openai/gpt-4');
  assert.ok(stats);
  assert.strictEqual(stats.searchCount, 1);
  assert.strictEqual(stats.clickCount, 1);
});

test('extractTitle pulls heading or first line', () => {
  assert.strictEqual(extractTitle('# Hello world'), 'Hello world');
  assert.strictEqual(extractTitle('Title: Example\nMore'), 'Example');
  assert.strictEqual(extractTitle('Just first line\nSecond line'), 'Just first line');
});
