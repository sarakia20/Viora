const { test } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const mongoose = require('mongoose')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { zodResolver } = require('@hookform/resolvers/zod')
const load = require('./helpers/load-typescript.cjs')
const { MobilePhoneSchema, ShippingAddressSchema } = load('lib/validator.ts')
const { MOBILE_PHONE_ERROR, normalizeMobileDigits } = load('lib/phone.ts')
const canonical = '09123456789'
const validPhones = [canonical, '۰۹۱۲۳۴۵۶۷۸۹', '٠٩١٢٣٤٥٦٧٨٩', '۰9١۲3۴٥6۷٨9']
const invalidPhones = ['', '0912345678', '091234567890', '08123456789', '19123456789',
  '09a23456789', '09123 56789', ' 09123456789', '09123456789 ', '09123456789\n',
  '09123456789\r\n', '09123456789\t', '+989123456789', '۰۹۱۲۳ ۵۶۷۸۹', '۰۹۱۲۳a۵۶۷۸۹', undefined, null, 9123456789]
const address = { fullName: 'مشتری', street: 'آدرس', city: 'شیراز', province: 'فارس', postalCode: '1234567890', country: 'Iran', phone: canonical }

test('English, Persian, Arabic and mixed mobile digits normalize without losing the leading zero', () => {
  for (const phone of validPhones) {
    assert.equal(normalizeMobileDigits(phone), canonical)
    assert.equal(MobilePhoneSchema.parse(phone), canonical)
    assert.deepEqual(ShippingAddressSchema.parse({ ...address, phone }), address)
  }
  assert.equal(normalizeMobileDigits(' ۰۹-١a\n'), ' 09-1a\n')
})

test('short/long numbers, wrong prefixes, letters, spaces and extra characters all fail with the required message', () => {
  assert.equal(MOBILE_PHONE_ERROR, 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود')
  for (const phone of invalidPhones) {
    const result = ShippingAddressSchema.safeParse({ ...address, phone })
    assert.equal(result.success, false, String(phone))
    assert.deepEqual(result.error.issues[0].path, ['phone'])
    assert.equal(result.error.issues[0].message, MOBILE_PHONE_ERROR)
  }
})

test('the real client resolver returns the phone field error and submits canonical English digits', async () => {
  const resolve = zodResolver(ShippingAddressSchema)
  const options = { criteriaMode: 'firstError', shouldUseNativeValidation: false, fields: {} }
  for (const phone of invalidPhones) {
    const result = await resolve({ ...address, phone }, {}, options)
    assert.equal(result.errors.phone.message, MOBILE_PHONE_ERROR)
    assert.deepEqual(result.values, {})
  }
  for (const phone of validPhones) {
    const result = await resolve({ ...address, phone }, {}, options)
    assert.deepEqual(result.errors, {})
    assert.equal(result.values.phone, canonical)
  }
})

test('address persistence rejects invalid phone before state changes and stores normalized digits', async () => {
  const { calculateTipaxTotals } = load('lib/shipping.ts')
  const store = load('hooks/use-cart-store.ts', {
    'zustand/middleware': { persist: initializer => initializer },
    '@/lib/actions/order.actions': { calcDeliveryDateAndPrice: async ({ items }) => calculateTipaxTotals(items) },
  }).default
  await store.getState().setShippingAddress(address)
  const before = store.getState().cart
  for (const phone of invalidPhones) {
    await assert.rejects(store.getState().setShippingAddress({ ...address, phone }))
    assert.equal(store.getState().cart, before)
  }
  await store.getState().setShippingAddress({ ...address, phone: '۰۹۱۲۳۴۵۶۷۸۹' })
  assert.deepEqual(store.getState().cart.shippingAddress, address)
})

test('checkout renders numeric 11-character input, phone field error and disabled address confirmation', async () => {
  const formValues = { ...address, phone: '09123' }
  const validation = await zodResolver(ShippingAddressSchema)(formValues, {}, { criteriaMode: 'firstError', shouldUseNativeValidation: false, fields: {} })
  const hookForm = require('react-hook-form')
  const Component = load('app/[locale]/checkout/checkout-form.tsx', {
    '@/hooks/use-cart-store': () => ({ cart: { items: [], paymentMethod: 'ZarinPal' } }),
    '@/hooks/use-setting-store': () => ({ setting: { site: {}, availablePaymentMethods: [{ name: 'ZarinPal' }], defaultPaymentMethod: 'ZarinPal' } }),
    '@/lib/actions/order.actions': {},
    '@/components/shared/product/product-price': ({ price }) => React.createElement('span', null, price),
    'next/navigation': { useRouter: () => ({ push() {} }) },
    'next/image': ({ src, alt }) => React.createElement('img', { src, alt }),
    'next/link': ({ href, children }) => React.createElement('a', { href }, children),
    'react-hook-form': { ...hookForm, useForm: options => hookForm.useForm({ ...options, defaultValues: formValues, errors: validation.errors }) },
  }).default
  const html = renderToStaticMarkup(React.createElement(Component))
  const input = html.match(/<input\b[^>]*name="phone"[^>]*>/)?.[0]
  assert.ok(input)
  assert.match(input, /inputMode="numeric"/i)
  assert.match(input, /maxLength="11"/i)
  assert.match(input, /aria-invalid="true"/)
  assert.ok(html.includes(MOBILE_PHONE_ERROR))
  const confirm = html.match(/<button\b[^>]*>تایید آدرس<\/button>/)?.[0]
  assert.ok(confirm && /\sdisabled(?:=|[\s>])/.test(confirm))
})

// Local MongoDB is real; authentication/settings are simulated. No .env.local or gateway calls.
test('server action rejects invalid mobile without inserting an order and stores normalized valid phones', { timeout: 45000 }, async t => {
  const database = 'viora_phone_test_' + randomUUID().replaceAll('-', '')
  const connection = await mongoose.createConnection('mongodb://127.0.0.1:27017/' + database, { serverSelectionTimeoutMS: 3000 }).asPromise()
  t.after(async () => {
    try {
      if (connection.name !== database || !database.startsWith('viora_phone_test_')) throw new Error('Unexpected test database')
      await connection.dropDatabase()
    } finally { await connection.close() }
  })
  const Order = connection.model('PhoneOrderTest', load('lib/db/models/order.model.ts').default.schema, 'orders')
  const product = { _id: new mongoose.Types.ObjectId(), name: 'کالا', slug: 'test', category: 'test', images: ['/test.png'], price: 1200, countInStock: 5, colors: [], sizes: [], isPublished: true }
  const actions = load('lib/actions/order.actions.ts', {
    '../db': { connectToDatabase: async () => connection },
    '@/auth': { auth: async () => ({ user: { id: new mongoose.Types.ObjectId().toString() } }) },
    '../db/models/order.model': Order, '../db/models/product.model': { findById: () => ({ lean: async () => product }) },
    '../db/models/user.model': {}, '@/emails': {}, '../paypal': {}, '../auth-guard': {},
    './setting.actions': { getSetting: async () => ({ availablePaymentMethods: [{ name: 'ZarinPal' }] }) },
    'next/cache': {}, 'next/navigation': {},
  })
  function submit(phone) {
    return actions.createOrder({
      items: [{ product: product._id.toString(), clientId: 'test-line', quantity: 2, price: 1, countInStock: 999 }],
      shippingAddress: { ...address, phone }, shippingMethod: 'تیپاکس', paymentMethod: 'ZarinPal',
      itemsPrice: 1, shippingPrice: 1, taxPrice: 1, totalPrice: 1,
    }, randomUUID())
  }
  for (const phone of invalidPhones) {
    assert.equal((await submit(phone)).success, false, String(phone))
    assert.equal(await Order.countDocuments(), 0)
  }
  for (const phone of validPhones) {
    const result = await submit(phone)
    assert.equal(result.success, true, result.message)
    const stored = await Order.findById(result.data.orderId).lean()
    assert.equal(stored.shippingAddress.phone, canonical)
    assert.equal(stored.totalPrice, 2400)
  }
})
