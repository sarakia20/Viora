// Run with node --test tests/zarinpal.test.cjs. No live DB or gateway calls.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const { webcrypto } = require('node:crypto')
const paymentMethods = require('./helpers/load-typescript.cjs')('lib/payment-methods.ts')

const orderId = '0123456789abcdef01234567'
const authority = 'A' + '1'.repeat(35)
const startPay = `https://www.zarinpal.com/pg/StartPay/${authority}`

function load(file, mocks, fetch) {
  const exports = {}
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  vm.runInNewContext(source, {
    exports, require: (id) => mocks[id] || (['../payment-methods', '@/lib/payment-methods'].includes(id) ? paymentMethods : {}), fetch, URL, AbortSignal,
    crypto: webcrypto,
    process: { env: { ZARINPAL_MERCHANT_ID: 'test-only', ZARINPAL_CALLBACK_BASE_URL: 'https://viora-store.ir' } },
    console: { info() {}, error() {} },
  }, { filename: file })
  return exports
}

function initiation({ paid = false, saved, lock = true, providerAuthority = authority } = {}) {
  const requests = []
  const writes = []
  const order = { _id: orderId, user: 'owner', totalPrice: 1234, paymentMethod: 'ZarinPal', isPaid: paid, paymentAuthority: saved }
  const model = {
    async findOne(filter) { assert.equal(filter.user, 'owner'); return order },
    async findOneAndUpdate(filter, update) { writes.push({ filter, update }); return lock ? order : null },
    async findById() { return order },
    async updateOne() {},
  }
  const actions = load('lib/actions/order.actions.ts', {
    '../db/models/order.model': model,
    '../db': { connectToDatabase: async () => {} },
    '../auth-guard': { requireUser: async () => ({ user: { id: 'owner' } }) },
    'next/navigation': { redirect(url) { throw Object.assign(new Error('redirect'), { url }) } },
  }, async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) })
    return { ok: true, status: 200, json: async () => ({ data: { code: 100, authority: providerAuthority } }) }
  })
  return { actions, requests, writes }
}

test('initiation uses owned DB order, converts toman to rial, saves authority before redirect', async () => {
  const { actions, requests, writes } = initiation()
  const result = await actions.createZarinPalPayment(orderId)
  assert.equal(result.redirectUrl, startPay)
  assert.equal(requests[0].body.amount, 12340)
  assert.equal(requests[0].body.callback_url, `https://viora-store.ir/api/payments/zarinpal/callback?orderId=${orderId}`)
  assert.equal(writes[1].update.$set.paymentAuthority, authority)
  assert.equal(writes[0].filter.isPaid, false)
})

test('form action preserves Next redirect instead of catching it as payment failure', async () => {
  await assert.rejects(initiation().actions.startZarinPalPayment(orderId), (error) => error.url === startPay)
})

test('paid orders and concurrent initiation never call gateway', async () => {
  for (const options of [{ paid: true }, { lock: false }]) {
    const { actions, requests } = initiation(options)
    assert.equal((await actions.createZarinPalPayment(orderId)).success, false)
    assert.equal(requests.length, 0)
  }
})

test('existing authority is reused and malformed provider authority is rejected', async () => {
  const existing = initiation({ saved: authority })
  assert.equal((await existing.actions.createZarinPalPayment(orderId)).redirectUrl, startPay)
  assert.equal(existing.requests.length, 0)
  for (const providerAuthority of ['', 'https://attacker.example']) {
    const run = initiation({ providerAuthority })
    assert.equal((await run.actions.createZarinPalPayment(orderId)).success, false)
    assert.equal(run.writes.length, 1)
  }
})

function callback({ status = 'OK', code = 100, ref = 123456, matched = true, paid = false, won = true } = {}) {
  let verified = 0, marked = 0, receipts = 0
  const order = { _id: orderId, paymentMethod: 'ZarinPal', paymentAuthority: matched ? authority : 'other', isPaid: paid, totalPrice: 1234, user: { email: 'test@example.invalid' } }
  const model = {
    findById() { return { populate: async () => order, select: async () => ({ isPaid: true }) } },
    async findOneAndUpdate(filter, update) {
      assert.equal(filter.isPaid, false)
      assert.equal(filter.paymentAuthority, authority)
      assert.equal(update.$set.paymentRefId, String(ref))
      if (!won) return null
      marked++
      return { user: order.user, populate: async () => {} }
    },
  }
  const route = load('app/api/payments/zarinpal/callback/route.ts', {
    'next/server': { NextResponse: { redirect: (url) => ({ url: String(url) }) } },
    '@/lib/db': { connectToDatabase: async () => {} },
    '@/lib/db/models/order.model': model,
    '@/emails': { sendPurchaseReceipt: async () => { receipts++ } },
    '@/lib/site-url': { SITE_URL: 'https://viora-store.ir' },
  }, async (url, options) => {
    verified++
    assert.equal(JSON.parse(options.body).amount, 12340)
    return { ok: true, status: 200, json: async () => ({ data: { code, ref_id: ref } }) }
  })
  return {
    run: () => route.GET({ nextUrl: new URL(`https://viora-store.ir/api/payments/zarinpal/callback?orderId=${orderId}&Authority=${authority}&Status=${status}`) }),
    counts: () => ({ verified, marked, receipts }),
  }
}

test('only verified codes 100/101 with reference mark order paid', async () => {
  for (const code of [100, 101]) {
    const flow = callback({ code })
    assert.match((await flow.run()).url, /result=success/)
    assert.deepEqual(flow.counts(), { verified: 1, marked: 1, receipts: 1 })
  }
  for (const options of [{ code: -51 }, { ref: 0 }, { ref: undefined, code: -50 }]) {
    const flow = callback(options)
    assert.match((await flow.run()).url, /result=failed/)
    assert.equal(flow.counts().marked, 0)
  }
})

test('cancelled and mismatched callbacks never verify or mark paid', async () => {
  for (const options of [{ status: 'NOK' }, { matched: false }]) {
    const flow = callback(options)
    assert.match((await flow.run()).url, /result=failed/)
    assert.deepEqual(flow.counts(), { verified: 0, marked: 0, receipts: 0 })
  }
})

test('repeated callback and losing concurrent callback do not send duplicate receipts', async () => {
  for (const options of [{ paid: true }, { won: false }]) {
    const flow = callback(options)
    assert.match((await flow.run()).url, /result=success/)
    assert.equal(flow.counts().marked, 0)
    assert.equal(flow.counts().receipts, 0)
  }
})
