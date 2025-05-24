import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractTitle } from '../server/routes';

test('extract title from markdown heading', () => {
  const res = extractTitle('# Heading\nContent here');
  assert.equal(res, 'Heading');
});

test('extract title from Title: line', () => {
  const res = extractTitle('Title: Sample\nMore text');
  assert.equal(res, 'Sample');
});

test('fallback to first words', () => {
  const res = extractTitle('This is a long response from the model with many words.');
  assert.equal(res, 'This is a long response...');
});

test('empty content', () => {
  const res = extractTitle('');
  assert.equal(res, 'AI Response');
});
