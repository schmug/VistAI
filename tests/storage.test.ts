import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemStorage } from '../server/storage';

test('incrementModelClicks updates existing model', async () => {
  const storage = new MemStorage();
  const modelId = 'openai/gpt-4';
  const statsBefore = await storage.getModelStats();
  const original = statsBefore.find(s => s.modelId === modelId);
  assert.ok(original);
  const initial = original!.clickCount;
  await storage.incrementModelClicks(modelId);
  const statsAfter = await storage.getModelStats();
  const updated = statsAfter.find(s => s.modelId === modelId);
  assert.ok(updated);
  assert.equal(updated!.clickCount, initial + 1);
});

test('incrementModelClicks creates new model stat', async () => {
  const storage = new MemStorage();
  const modelId = 'custom/new-model';
  const statsBefore = await storage.getModelStats();
  assert.ok(!statsBefore.some(s => s.modelId === modelId));
  await storage.incrementModelClicks(modelId);
  const statsAfter = await storage.getModelStats();
  const created = statsAfter.find(s => s.modelId === modelId);
  assert.ok(created);
  assert.equal(created!.clickCount, 1);
  assert.equal(created!.searchCount, 0);
});
