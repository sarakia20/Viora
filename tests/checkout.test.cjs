// Uses an isolated, disposable database on local MongoDB; never reads .env.local.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const mongoose = require('mongoose')
const load = require('./helpers/load-typescript.cjs')

test('checkout persistence and retries on local MongoDB', { timeout: 45000 }, async t => {
  const database = 'viora_checkout_test_' + randomUUID().replaceAll('-', '')
  const connection = await mongoose.createConnection('mongodb://127.0.0.1:27017/' + database, { serverSelectionTimeoutMS: 3000 }).asPromise()
  t.after(async () => {
    try {
      if (connection.name !== database || !database.startsWith('viora_checkout_test_')) throw new Error('Unexpected test database')
      await connection.dropDatabase()
    } finally {
      await connection.close()
    }
  })
  const OrderSchema = load('lib/db/models/order.model.ts').default.schema
  const Order = connection.model('CheckoutTestOrder', OrderSchema, 'orders')
  const Product = connection.model('CheckoutTestProduct', new mongoose.Schema({
    name: String, slug: String, category: String, images: [String], price: Number,
    countInStock: Number, isPublished: Boolean,
    variants: [{ color: String, image: String, price: Number, countInStock: Number }],
  }), 'products')
  const product = await Product.create({ name: 'کالای آزمایشی', slug: 'checkout-test', category: 'test', images: ['/test.png'], price: 1200, countInStock: 5, isPublished: true })
  let userId = new mongoose.Types.ObjectId().toString()
  let databaseUnavailable = false
  const logs = []
  const actions = load('lib/actions/order.actions.ts', {
    '../db': { connectToDatabase: async () => { if (databaseUnavailable) throw new Error('private connection details'); return connection } },
    '@/auth': { auth: async () => userId ? { user: { id: userId } } : null },
    '../db/models/order.model': Order,
    '../db/models/product.model': Product,
    '../db/models/user.model': {},
    '@/emails': {},
    '../paypal': {},
    './setting.actions': { getSetting: async () => ({ availablePaymentMethods: [{ name: 'ZarinPal' }] }) },
    '../auth-guard': {},
    'next/cache': {},
    'next/navigation': {},
    '../site-url': { SITE_URL: 'https://viora-store.ir' },
  }, { console: { info: (...args) => logs.push(args), error: (...args) => logs.push(args) } })
  const cart = {
    items: [{ product: product._id.toString(), clientId: 'test-line', name: 'untrusted', slug: 'untrusted', category: 'test', image: '/test.png', price: 1, countInStock: 100, quantity: 2 }],
    shippingAddress: { fullName: 'مشتری آزمایشی', street: 'آدرس آزمایشی', city: 'شیراز', province: 'فارس', phone: '09123456789', postalCode: '1234567890', country: 'Iran' },
    shippingMethod: 'تیپاکس', paymentMethod: 'ZarinPal', itemsPrice: 1, shippingPrice: 90000, taxPrice: 999, totalPrice: 1,
  }

  await t.test('creates an actual MongoDB document with validated address, Tipax and server price', async () => {
    const result = await actions.createOrder(cart, randomUUID())
    assert.equal(result.success, true, result.message)
    assert.match(result.data.orderId, /^[a-f\d]{24}$/)
    const stored = await Order.findById(result.data.orderId).lean()
    assert.ok(stored)
    assert.equal(stored.user.toString(), userId)
    assert.equal(stored.items[0].price, 1200)
    assert.equal(stored.totalPrice, 2400)
    assert.equal(stored.shippingPrice, 0)
    assert.equal(stored.shippingMethod, 'تیپاکس')
    assert.equal(stored.shippingAddress.province, 'فارس')
    assert.equal(stored.isPaid, false)
  })

  await t.test('sequential retries and four simultaneous submissions create only one document', async () => {
    const requestId = randomUUID()
    const before = await Order.countDocuments()
    const results = await Promise.all(Array.from({ length: 4 }, () => actions.createOrder(cart, requestId)))
    for (const result of results) assert.equal(result.success, true, result.message)
    assert.equal(new Set(results.map(result => result.data.orderId)).size, 1)
    const retry = await actions.createOrder(cart, requestId)
    assert.equal(retry.data.orderId, results[0].data.orderId)
    assert.equal(await Order.countDocuments(), before + 1)
  })

  await t.test('invalid address, stock, delivery or payment never creates a document', async () => {
    const before = await Order.countDocuments()
    for (const override of [
      { shippingAddress: { ...cart.shippingAddress, province: '' } },
      { shippingMethod: undefined }, { shippingMethod: 'old' }, { deliveryDateIndex: 0 },
      { paymentMethod: 'inactive' }, { items: [{ ...cart.items[0], quantity: 99 }] },
    ]) {
      const result = await actions.createOrder({ ...cart, ...override }, randomUUID())
      assert.equal(result.success, false)
      assert.ok(/[\u0600-\u06ff]/.test(result.message))
    }
    assert.equal(await Order.countDocuments(), before)
  })

  await t.test('missing request ID and expired authentication fail safely', async () => {
    const before = await Order.countDocuments()
    assert.equal((await actions.createOrder(cart)).success, false)
    assert.equal((await actions.createOrder(cart, 'invalid')).success, false)
    const savedUser = userId
    userId = null
    const result = await actions.createOrder(cart, randomUUID())
    userId = savedUser
    assert.equal(result.success, false)
    assert.match(result.message, /وارد حساب/)
    assert.equal(await Order.countDocuments(), before)
  })

  await t.test('request IDs are isolated by authenticated user', async () => {
    const requestId = randomUUID()
    const first = await actions.createOrder(cart, requestId)
    const savedUser = userId
    userId = new mongoose.Types.ObjectId().toString()
    const second = await actions.createOrder(cart, requestId)
    userId = savedUser
    assert.equal(first.success, true)
    assert.equal(second.success, true)
    assert.notEqual(first.data.orderId, second.data.orderId)
  })

  await t.test('database errors return a Persian message and log only safe stage metadata', async () => {
    databaseUnavailable = true
    const result = await actions.createOrder(cart, randomUUID())
    databaseUnavailable = false
    assert.equal(result.success, false)
    assert.ok(/[\u0600-\u06ff]/.test(result.message))
    assert.ok(!result.message.includes('private connection'))
    assert.ok(!JSON.stringify(logs).includes('private connection'))
    assert.ok(logs.some(entry => entry[1]?.stage === 'connect_database'))
  })
})
