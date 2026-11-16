// Actual isolated local MongoDB; authentication, gateway HTTP and Next redirects are simulated.
// Never loads .env.local or uses production data.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const mongoose = require('mongoose')
const load = require('./helpers/load-typescript.cjs')

test('online order labels preserve owned payment, server amount and callback validation', { timeout: 45000 }, async t => {
  const database = 'viora_online_test_' + randomUUID().replaceAll('-', '')
  const connection = await mongoose.createConnection('mongodb://127.0.0.1:27017/' + database, { serverSelectionTimeoutMS: 3000 }).asPromise()
  t.after(async () => {
    try {
      if (connection.name !== database || !database.startsWith('viora_online_test_')) throw new Error('Unexpected test database')
      await connection.dropDatabase()
    } finally { await connection.close() }
  })
  const Order = connection.model('OnlineOrderTest', load('lib/db/models/order.model.ts').default.schema, 'orders')
  const User = connection.model('User', new mongoose.Schema({ email: String, role: String }), 'users')
  const user = await User.create({ email: 'test@example.invalid', role: 'User' })
  let userId = user.id, verifyCode = 100, receipts = 0
  const requests = []
  const mocks = {
    '../db': { connectToDatabase: async () => connection }, '@/lib/db': { connectToDatabase: async () => connection },
    '@/auth': {}, '../db/models/order.model': Order, '@/lib/db/models/order.model': Order,
    '../db/models/user.model': User, '../db/models/product.model': {}, './setting.actions': {},
    '@/emails': { sendPurchaseReceipt: async () => { receipts++ } }, '../paypal': {}, 'next/cache': {},
    '../auth-guard': { requireUser: async () => ({ user: { id: userId } }), requireAdmin: async () => {} },
    'next/navigation': { redirect(url) { throw Object.assign(new Error('Next redirect simulated'), { url }) } },
    'next/server': { NextResponse: { redirect: url => ({ url: String(url) }) } },
  }
  const globals = {
    process: { env: { ZARINPAL_MERCHANT_ID: '12345678-1234-1234-1234-123456789012', ZARINPAL_CALLBACK_BASE_URL: 'https://viora-store.ir' } },
    fetch: async (url, options) => {
      const body = JSON.parse(options.body)
      requests.push({ url, body })
      assert.equal(body.amount, 24000)
      return { ok: true, status: 200, json: async () => ({ data: url.includes('/verify.')
        ? { code: verifyCode, ref_id: 123456 }
        : { code: 100, authority: 'A' + randomUUID().replaceAll('-', '') + '000' } }) }
    },
  }
  const actions = load('lib/actions/order.actions.ts', mocks, globals)
  const callback = load('app/api/payments/zarinpal/callback/route.ts', mocks, globals)
  async function order(paymentMethod, extra = {}) {
    return Order.create({
      user: user.id, items: [{ product: new mongoose.Types.ObjectId(), clientId: 'test', name: 'کالا', slug: 'test', category: 'test', image: '/test.png', price: 1200, quantity: 2, countInStock: 5 }],
      shippingAddress: { fullName: 'مشتری', street: 'آدرس', city: 'شیراز', province: 'فارس', phone: '09123456789', postalCode: '1234567890', country: 'Iran' },
      shippingMethod: 'تیپاکس', paymentMethod, itemsPrice: 2400, shippingPrice: 0, taxPrice: 0, totalPrice: 2400, ...extra,
    })
  }
  async function runCallback(saved, status = 'OK', authority) {
    const latest = await Order.findById(saved.id)
    return callback.GET({ nextUrl: new URL(`https://viora-store.ir/api/payments/zarinpal/callback?orderId=${saved.id}&Authority=${authority || latest.paymentAuthority}&Status=${status}`) })
  }

  await t.test('both stored labels can start and verify payment; repeat payment never calls gateway', async () => {
    for (const method of ['ZarinPal', 'پرداخت آنلاین']) {
      const saved = await order(method)
      await assert.rejects(actions.startZarinPalPayment(saved.id), error => /^https:\/\/(www|payment)\.zarinpal\.com\/pg\/StartPay\/A\w{35}$/.test(error.url))
      assert.equal((await Order.findById(saved.id)).paymentMethod, method)
      assert.equal((await Order.findById(saved.id)).isPaid, false)
      const receiptCount = receipts
      assert.match((await runCallback(saved)).url, /result=success/)
      assert.equal((await Order.findById(saved.id)).paymentRefId, '123456')
      assert.equal((await Order.findById(saved.id)).isPaid, true)
      const count = requests.length
      assert.equal((await actions.createZarinPalPayment(saved.id)).success, false)
      assert.match((await runCallback(saved)).url, /result=success/)
      assert.equal(requests.length, count)
      assert.equal(receipts, receiptCount + 1)
    }
  })

  await t.test('foreign owner, invalid amount, unrelated method and manual confirmation are rejected', async () => {
    const saved = await order('پرداخت آنلاین')
    const count = requests.length
    userId = new mongoose.Types.ObjectId().toString()
    assert.equal((await actions.createZarinPalPayment(saved.id)).success, false)
    userId = user.id
    for (const invalid of [await order('پرداخت آنلاین', { totalPrice: 0 }), await order('Cash On Delivery')]) {
      assert.equal((await actions.createZarinPalPayment(invalid.id)).success, false)
    }
    assert.equal((await actions.updateOrderToPaid(saved.id)).success, false)
    assert.equal((await Order.findById(saved.id)).isPaid, false)
    assert.equal(requests.length, count)
  })

  await t.test('cancelled, mismatched and declined callbacks cannot mark the Persian label paid', async () => {
    const saved = await order('پرداخت آنلاین')
    assert.equal((await actions.createZarinPalPayment(saved.id)).success, true)
    const count = requests.length
    assert.match((await runCallback(saved, 'NOK')).url, /result=failed/)
    assert.match((await runCallback(saved, 'OK', 'A' + '0'.repeat(35))).url, /result=failed/)
    assert.equal(requests.length, count)
    verifyCode = -51
    assert.match((await runCallback(saved)).url, /result=failed/)
    assert.equal((await Order.findById(saved.id)).isPaid, false)
  })
})
