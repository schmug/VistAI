import test from 'node:test';
import assert from 'node:assert/strict';
import { searchAIStream, SearchStreamEvent } from '../client/src/lib/openrouter.ts';

// Provide minimal browser globals for apiRequest
(globalThis as any).window = {
  location: { href: 'http://localhost', origin: 'http://localhost' },
};

/** Create a mock SSE Response */
function makeSseResponse(payload: string): Response {
  return new Response(payload, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

test('searchAIStream parses SSE events', async () => {
  const search = { id: 1, query: 'foo', createdAt: '2024-01-01T00:00:00.000Z' } as any;
  const result1 = {
    id: 10,
    searchId: 1,
    modelId: 'model/A',
    content: 'A',
    title: 'A',
    responseTime: 50,
    createdAt: '2024-01-01T00:00:01.000Z',
    modelName: 'A',
  } as any;
  const result2 = {
    id: 11,
    searchId: 1,
    modelId: 'model/B',
    content: 'B',
    title: 'B',
    responseTime: 75,
    createdAt: '2024-01-01T00:00:02.000Z',
    modelName: 'B',
  } as any;
  const finalData = { search, results: [result1, result2], totalTime: 75 } as any;

  const sse = [
    `event: search`,
    `data: ${JSON.stringify(search)}`,
    '',
    `event: result`,
    `data: ${JSON.stringify(result1)}`,
    '',
    `event: result`,
    `data: ${JSON.stringify(result2)}`,
    '',
    `event: done`,
    `data: ${JSON.stringify(finalData)}`,
    '',
    '',
  ].join('\n');

  const response = makeSseResponse(sse);

  const originalFetch = global.fetch;
  global.fetch = async () => response;

  const events: SearchStreamEvent[] = [];
  const promise = searchAIStream('foo', (evt) => events.push(evt));
  const data = await promise;

  global.fetch = originalFetch;

  assert.strictEqual(events[0].type, 'search');
  assert.deepStrictEqual(events[0].data, search);
  assert.strictEqual(events[1].type, 'result');
  assert.deepStrictEqual(events[1].data, result1);
  assert.strictEqual(events[2].type, 'result');
  assert.deepStrictEqual(events[2].data, result2);
  assert.strictEqual(events[3].type, 'done');
  assert.deepStrictEqual(events[3].data, finalData);
  assert.deepStrictEqual(data, finalData);
});
