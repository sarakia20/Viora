// Real checkout action and schemas; no production database, secrets or gateway.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const load = require('./helpers/load-typescript.cjs')

function setup(overrides = {}) {
  const product = {
    _id: '0123456789abcdef01234567', name: 'محصول آزمایشی', slug: 'test',
    category: 'test', images: ['/test.png'], isPublished: true,
    price: 1200, countInStock: 5, colors: [], sizes: [], variants: [], ...overrides,
  }
  const saved = []
  const actions = load('lib/actions/order.actions.ts', {
    '../db': { connectToDatabase: async () => {} },
    '@/auth': { auth: async () => ({ user: { id: '1123456789abcdef01234567' } }) },
    '../db/models/order.model': {
      findOne: async () => null,
      create: async order => { saved.push(order); return order },
    },
    '../db/models/product.model': { findById: async () => product },
    '../db/models/user.model': {}, '@/emails': {}, '../paypal': {},
    './setting.actions': { getSetting: async () => ({ availablePaymentMethods: [{ name: 'ZarinPal' }] }) },
    '../auth-guard': {}, 'next/cache': {}, 'next/navigation': {},
    '../site-url': { SITE_URL: 'https://viora-store.ir' },
  })
  return {
    saved,
    submit: item => actions.createOrder({
      items: [{ product: product._id, clientId: 'line', quantity: 2, price: 1, countInStock: 999, ...item }],
      shippingAddress: { fullName: 'آزمایشی', street: 'آدرس', city: 'شیراز', province: 'فارس', phone: '09123456789', postalCode: '1234567890', country: 'Iran' },
      shippingMethod: 'تیپاکس', paymentMethod: 'ZarinPal',
      itemsPrice: 1, shippingPrice: 1, taxPrice: 1, totalPrice: 1,
    }, randomUUID()),
  }
}

const variant = { color: 'مشکی', price: 2500, countInStock: 3, image: '/black.png' }

test('variant checkout uses current server price, stock and image and returns payment page ID', async () => {
  const { submit, saved } = setup({ variants: [variant] })
  const result = await submit({ color: 'مشکی' })
  assert.equal(result.success, true, result.message)
  assert.match(result.data.orderId, /^[a-f\d]{24}$/)
  assert.equal(saved[0].items[0].price, 2500)
  assert.equal(saved[0].items[0].countInStock, 3)
  assert.equal(saved[0].items[0].image, '/black.png')
  assert.equal(saved[0].totalPrice, 5000)
})

test('product without options uses current base price', async () => {
  const { submit, saved } = setup()
  assert.equal((await submit({})).success, true)
  assert.equal(saved[0].totalPrice, 2400)
})

test('legacy colors and sizes remain valid without variants', async () => {
  const { submit, saved } = setup({ colors: ['مشکی'], sizes: ['بزرگ'] })
  assert.equal((await submit({ color: 'مشکی', size: 'بزرگ', price: 10 })).success, true)
  assert.equal(saved[0].items[0].color, 'مشکی')
  assert.equal(saved[0].totalPrice, 2400)
})

test('deleted, missing and stale options never save an order and explain recovery in Persian', async () => {
  for (const [product, item] of [
    [{ variants: [variant] }, { color: 'حذف‌شده' }],
    [{ variants: [variant] }, {}],
    [{ colors: ['جدید'] }, { color: 'قدیمی' }],
    [{ colors: ['مشکی'] }, {}],
    [{}, { color: 'حذف‌شده' }],
    [{ sizes: ['جدید'] }, { size: 'قدیمی' }],
    [{ sizes: ['جدید'] }, {}],
  ]) {
    const { submit, saved } = setup(product)
    const result = await submit(item)
    assert.equal(result.success, false)
    assert.match(result.message, /از سبد حذف کنید/)
    assert.equal(saved.length, 0)
  }
})

test('out of stock and incomplete variants cannot fall back to base stock or price', async () => {
  for (const option of [
    { ...variant, countInStock: 0 }, { ...variant, countInStock: undefined },
    { ...variant, price: undefined }, { ...variant, price: -1 },
  ]) {
    const { submit, saved } = setup({ variants: [option] })
    assert.equal((await submit({ color: 'مشکی' })).success, false)
    assert.equal(saved.length, 0)
  }
})
