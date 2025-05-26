import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTitle } from '../worker/worker.js';


test('extractTitle pulls heading or first line', () => {
  assert.strictEqual(extractTitle('# Hello world'), 'Hello world');
  assert.strictEqual(extractTitle('Title: Example\nMore'), 'Example');
  assert.strictEqual(extractTitle('Just first line\nSecond line'), 'Just first line');
});
