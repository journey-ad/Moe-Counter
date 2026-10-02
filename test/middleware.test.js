'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { z } = require('zod')

const { cors, ZodValid } = require('../utils/middleware')

function fakeRes() {
  return {
    headers: {},
    statusCode: null,
    header(key, value) { this.headers[key] = value },
    status(code) { this.statusCode = code; return this },
    send(body) { this.body = body; return this },
    sendStatus(code) { this.statusCode = code; return this }
  }
}

test('cors 默认放行任意来源并在响应头里返回该来源', () => {
  const res = fakeRes()
  let nexted = false

  cors()({ headers: { origin: 'https://a.test' }, method: 'GET' }, res, () => { nexted = true })

  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://a.test')
  assert.equal(res.headers['Access-Control-Allow-Credentials'], 'true')
  assert.equal(nexted, true)
})

test('cors 白名单之外的来源不设置任何头', () => {
  const res = fakeRes()
  let nexted = false

  cors({ allowOrigins: ['https://a.test'] })({ headers: { origin: 'https://b.test' }, method: 'GET' }, res, () => { nexted = true })

  assert.deepEqual(res.headers, {})
  assert.equal(nexted, true)
})

test('cors 对跨域预检请求返回 204 并原样返回请求方法与请求头', () => {
  const res = fakeRes()
  let nexted = false

  cors()({
    headers: { origin: 'https://a.test', 'access-control-request-method': 'POST', 'access-control-request-headers': 'x-token' },
    method: 'OPTIONS'
  }, res, () => { nexted = true })

  assert.equal(res.statusCode, 204)
  assert.equal(res.headers['Access-Control-Allow-Methods'], 'POST')
  assert.equal(res.headers['Access-Control-Allow-Headers'], 'x-token')
  assert.equal(nexted, false)
})

test('ZodValid 校验失败返回 400 并在消息里写明字段名', () => {
  const res = fakeRes()
  let nexted = false

  ZodValid({ params: z.object({ name: z.string().min(1).max(32) }) })({ params: { name: '' } }, res, () => { nexted = true })

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.code, 400)
  assert.match(res.body.message, /The field `name` is invalid/)
  assert.equal(nexted, false)
})

test('ZodValid 把解析后的值写回请求对象', () => {
  const req = { query: { padding: '12' } }
  let nexted = false

  ZodValid({ query: z.object({ padding: z.coerce.number().int().min(0).max(16).default(7) }) })(req, fakeRes(), () => { nexted = true })

  assert.deepEqual(req.query, { padding: 12 })
  assert.equal(nexted, true)
})

test('ZodValid 跳过未声明的字段', () => {
  const req = { params: { name: 'a' }, query: { raw: '1' } }
  let nexted = false

  ZodValid({ params: z.object({ name: z.string() }) })(req, fakeRes(), () => { nexted = true })

  assert.deepEqual(req.query, { raw: '1' })
  assert.equal(nexted, true)
})
