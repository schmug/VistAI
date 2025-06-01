import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import worker from '../worker/worker.js'
import { FakeD1Database } from './fake-db.js'

/** Ensure register/login return signed JWT tokens. */
test('authentication tokens are signed', async () => {
  const db = new FakeD1Database()
  const env = { DB: db, OPENROUTER_API_KEY: 'k', JWT_SECRET: 'secret' }

  const regReq = new Request('http://localhost/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'u', password: 'p' }),
  })
  const regRes = await worker.fetch(regReq, env)
  const reg = await regRes.json()
  const [h, b, s] = reg.token.split('.')
  const expected = crypto.createHmac('sha256', env.JWT_SECRET).update(`${h}.${b}`).digest('base64url')
  assert.strictEqual(s, expected)
  const payload = JSON.parse(Buffer.from(b, 'base64url').toString())
  assert.strictEqual(payload.userId, 1)

  const loginReq = new Request('http://localhost/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'u', password: 'p' }),
  })
  const loginRes = await worker.fetch(loginReq, env)
  const { token } = await loginRes.json()
  assert.ok(token && token.split('.').length === 3)
})
