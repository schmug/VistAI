import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { extractTitle, extractSnippet } from '../worker/worker.js';


test('extractTitle pulls heading or first line', () => {
  assert.strictEqual(extractTitle('# Hello world'), 'Hello world');
  assert.strictEqual(extractTitle('Title: Example\nMore'), 'Example');
  assert.strictEqual(extractTitle('Just first line\nSecond line'), 'Just first line');
});

test('extractSnippet parses summary tag', () => {
  const input = '<summary>Brief</summary>Full answer here';
  assert.deepStrictEqual(extractSnippet(input), { snippet: 'Brief', body: 'Full answer here' });
});

test('missing DB returns descriptive error', async () => {
  const req = new Request('http://localhost/api/status');
  const res = await worker.fetch(req, { OPENROUTER_API_KEY: 'key' });
  assert.strictEqual(res.status, 500);
  const data = await res.json();
  assert.strictEqual(data.message, 'Database binding DB is not configured');
});
