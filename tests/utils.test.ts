import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSearchTime, getModelNameFromId } from '../client/src/lib/utils.ts';

test('formatSearchTime formats milliseconds to seconds', () => {
  assert.strictEqual(formatSearchTime(1234), '1.23');
  assert.strictEqual(formatSearchTime(1000), '1.00');
});

test('getModelNameFromId extracts last segment', () => {
  assert.strictEqual(getModelNameFromId('openai/gpt-4'), 'gpt-4');
  assert.strictEqual(getModelNameFromId('model'), 'model');
});
