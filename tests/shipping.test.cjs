const { test } = require('node:test')
const assert = require('node:assert/strict')
const load = require('./helpers/load-typescript.cjs')

const shipping = load('lib/shipping.ts')
const { TIPAX_SHIPPING_METHOD, SHIPPING_PAY_ON_DELIVERY, calculateTipaxTotals, normalizeCartShipping, isTipaxShipping } = shipping
const Order = load('lib/db/models/order.model.ts').default
const orderId = '0123456789abcdef01234567'
const userId = '1123456789abcdef01234567'
const productId = '2123456789abcdef01234567'
const authority = 'A' + '1'.repeat(35)
const address = { fullName: 'مشتری', street: 'آدرس', city: 'شیراز', province: 'فارس', phone: '09123456789', postalCode: '1234567890', country: 'Iran' }
const item = { product: productId, clientId: 'test-item', name: 'کالا', slug: 'test-product', category: 'test', image: '/test.png', price: 1, countInStock: 10, quantity: 2 }

function harness(productOverrides = {}) {
  const stored = [], requests = []
  let receipts = 0
  const model = {
    async create(data) {
      // Exercise the real Mongoose persistence schema without saving to a live DB.
      const document = new Order(data)
      await document.validate()
      const order = { ...document.toObject(), _id: document._id.toString(), user: userId }
      stored.push(order)
      return order
    },
    async findOne(filter) { return stored.find(order => order._id === filter._id && order.user === filter.user) },
    findById() {
      return {
        populate: async () => stored[0] && { ...stored[0], user: { email: 'test@example.invalid' } },
        select: async () => stored[0],
      }
    },
    async findOneAndUpdate(filter, update) {
      const order = stored[0]
      if (!order || order.isPaid || (typeof filter.paymentAuthority === 'string' && order.paymentAuthority !== filter.paymentAuthority)) return null
      if (update.$set.paymentRequestId && order.paymentRequestId) return null
      if (filter.paymentRequestId && order.paymentRequestId !== filter.paymentRequestId) return null
      Object.assign(order, update.$set)
      for (const key of Object.keys(update.$unset || {})) delete order[key]
      return { ...order, user: { email: 'test@example.invalid' }, populate: async () => {} }
    },
    async updateOne() {},
  }
  const mocks = {
    '../db': { connectToDatabase: async () => {} },
    '@/lib/db': { connectToDatabase: async () => {} },
    '@/auth': { auth: async () => ({ user: { id: userId } }) },
    '../db/models/order.model': model,
    '@/lib/db/models/order.model': model,
    '../db/models/product.model': { findById: () => ({ lean: async () => ({ ...item, images: [item.image], _id: productId, price: 1200, isPublished: true, ...productOverrides }) }) },
    '../db/models/user.model': {},
    '@/emails': { sendPurchaseReceipt: async () => { receipts++ } },
    '../paypal': {},
    './setting.actions': { getSetting: async () => ({ availablePaymentMethods: ['ZarinPal', 'Stripe', 'PayPal', 'Cash On Delivery'].map(name => ({ name })), availableDeliveryDates: [{ name: 'old', shippingPrice: 999999, daysToDeliver: 1 }] }) },
    '../auth-guard': { requireUser: async () => ({ user: { id: userId } }) },
    'next/cache': {},
    'next/navigation': {},
    'next/server': { NextResponse: { redirect: url => ({ url: String(url) }) } },
    '../site-url': { SITE_URL: 'https://viora-store.ir' },
    '@/lib/site-url': { SITE_URL: 'https://viora-store.ir' },
  }
  const globals = {
    process: { env: { ZARINPAL_MERCHANT_ID: 'test-only', ZARINPAL_CALLBACK_BASE_URL: 'https://viora-store.ir' } },
    fetch: async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body) })
      return { ok: true, status: 200, json: async () => ({ data: url.includes('verify') ? { code: 100, ref_id: 123456 } : { code: 100, authority } }) }
    },
  }
  const actions = load('lib/actions/order.actions.ts', mocks, globals)
  return {
    actions: { ...actions, createOrder: (cart, id = '12345678-1234-4234-8234-123456789012') => actions.createOrder(cart, id) },
    callback: load('app/api/payments/zarinpal/callback/route.ts', mocks, globals),
    stored, requests, receipts: () => receipts,
  }
}

function cart(overrides = {}) {
  return { items: [item], shippingAddress: address, shippingMethod: TIPAX_SHIPPING_METHOD, paymentMethod: 'ZarinPal', itemsPrice: 1, shippingPrice: 80000, taxPrice: 999, totalPrice: 80001, ...overrides }
}

test('online totals exclude shipping for any city and retain monetary rounding', () => {
  const totals = calculateTipaxTotals([{ price: 12.34, quantity: 3 }, { price: 0.1, quantity: 2 }])
  assert.equal(totals.itemsPrice, 37.22)
  assert.equal(totals.totalPrice, 37.22)
  assert.equal(totals.shippingPrice, 0)
  assert.equal(totals.taxPrice, 0)
  assert.equal(totals.shippingMethod, 'تیپاکس')
  assert.equal(totals.expectedDeliveryDate, undefined)
})

test('old saved cart loses obsolete delivery selection and fee without mutating its input', () => {
  const old = cart({ shippingMethod: undefined, deliveryDateIndex: 2, expectedDeliveryDate: new Date() })
  const normalized = normalizeCartShipping(old)
  assert.equal(normalized.shippingMethod, TIPAX_SHIPPING_METHOD)
  assert.equal(normalized.shippingPrice, 0)
  assert.equal(normalized.totalPrice, 2)
  assert.equal(normalized.deliveryDateIndex, undefined)
  assert.equal(normalized.expectedDeliveryDate, undefined)
  assert.equal(old.shippingPrice, 80000)
  assert.equal(old.deliveryDateIndex, 2)
})

test('server calculates and persists canonical product amount, Tipax, and zero online shipping', async () => {
  for (const city of ['تهران', 'شیراز']) {
    const h = harness()
    const result = await h.actions.createOrder(cart({ shippingAddress: { ...address, city }, shippingPrice: -99999, totalPrice: 0, expectedDeliveryDate: 'invalid-client-date' }))
    assert.equal(result.success, true, result.message)
    assert.equal(h.stored[0].items[0].price, 1200)
    assert.equal(h.stored[0].itemsPrice, 2400)
    assert.equal(h.stored[0].shippingMethod, TIPAX_SHIPPING_METHOD)
    assert.equal(h.stored[0].shippingPrice, 0)
    assert.equal(h.stored[0].totalPrice, 2400)
    assert.equal(h.stored[0].expectedDeliveryDate, undefined)
  }
})

test('adding a grade refreshes its existing cart price and checkout charges the selected grade', async () => {
  const selected = { color: 'درجه ۲', price: 2400.125, listPrice: 3000, countInStock: 6 }
  const variants = [{ color: 'درجه ۱', price: 3600, listPrice: 4000, countInStock: 2 }, selected]
  const store = load('hooks/use-cart-store.ts', {
    'zustand/middleware': { persist: initializer => initializer },
    '@/lib/actions/order.actions': { calcDeliveryDateAndPrice: async ({ items }) => calculateTipaxTotals(items) },
  }).default
  store.setState({ cart: cart({ items: [{ ...item, color: selected.color, quantity: 1 }] }) })
  await store.getState().addItem({ ...item, ...selected, price: 2400.13, clientId: 'new-id' }, 1)
  const updatedCart = store.getState().cart
  assert.equal(updatedCart.items[0].clientId, item.clientId)
  assert.equal(updatedCart.items[0].price, 2400.13)
  assert.equal(updatedCart.totalPrice, 4800.26)
  const h = harness({ variants })
  const result = await h.actions.createOrder(updatedCart)
  assert.equal(result.success, true, result.message)
  assert.equal(h.stored[0].items[0].color, selected.color)
  assert.equal(h.stored[0].items[0].price, 2400.13)
  assert.equal(h.stored[0].totalPrice, updatedCart.totalPrice)
})

test('missing, disabled or legacy delivery selection cannot create an order', async () => {
  for (const overrides of [{ shippingMethod: undefined }, { shippingMethod: null }, { shippingMethod: '' }, { shippingMethod: 'old' }, { deliveryDateIndex: 0 }, { deliveryDateIndex: -1 }, { deliveryDateIndex: 100000 }]) {
    const h = harness()
    assert.equal((await h.actions.createOrder(cart(overrides))).success, false)
    assert.equal(h.stored.length, 0)
    assert.equal(h.requests.length, 0)
  }
})

test('invalid address and empty cart still fail validation; other payment methods still create orders', async () => {
  for (const overrides of [{ shippingAddress: { ...address, province: '' } }, { items: [] }]) {
    const h = harness()
    assert.equal((await h.actions.createOrder(cart(overrides))).success, false)
    assert.equal(h.stored.length, 0)
  }
  for (const paymentMethod of ['Stripe', 'PayPal', 'Cash On Delivery']) {
    const h = harness()
    assert.equal((await h.actions.createOrder(cart({ paymentMethod }))).success, true)
    assert.equal(h.stored[0].paymentMethod, paymentMethod)
    assert.equal(h.stored[0].totalPrice, 2400)
  }
})

test('ZarinPal request and verify both use the saved online total without carrier costs', async () => {
  const h = harness()
  assert.equal((await h.actions.createOrder(cart())).success, true)
  const savedOrderId = h.stored[0]._id
  const payment = await h.actions.createZarinPalPayment(savedOrderId)
  assert.equal(payment.redirectUrl, `https://www.zarinpal.com/pg/StartPay/${authority}`)
  assert.equal(h.stored[0].isPaid, false)
  const result = await h.callback.GET({ nextUrl: new URL(`https://viora-store.ir/api/payments/zarinpal/callback?orderId=${savedOrderId}&Authority=${authority}&Status=OK`) })
  assert.match(result.url, /result=success/)
  assert.equal(h.requests.length, 2)
  assert.equal(h.requests[0].body.amount, 24000)
  assert.equal(h.requests[1].body.amount, 24000)
  assert.equal(h.stored[0].isPaid, true)
  assert.equal(h.stored[0].shippingPrice, 0)
  assert.equal(h.receipts(), 1)
})

test('legacy orders retain their own shipping cost and date; no Tipax default is added', async () => {
  const legacy = new Order({ ...cart(), shippingMethod: undefined, user: userId, shippingPrice: 75, itemsPrice: 2400, totalPrice: 2475, taxPrice: 0, expectedDeliveryDate: new Date('2020-01-01') })
  await legacy.validate()
  assert.equal(legacy.shippingMethod, undefined)
  assert.equal(isTipaxShipping(legacy), false)
  assert.equal(legacy.shippingPrice, 75)
  assert.equal(legacy.totalPrice, 2475)
  assert.equal(legacy.expectedDeliveryDate.getUTCFullYear(), 2020)
  const tipax = new Order({ ...legacy.toObject(), shippingMethod: TIPAX_SHIPPING_METHOD, shippingPrice: 75 })
  await assert.rejects(tipax.validate(), /هزینه ارسال آنلاین تیپاکس باید صفر باشد/)
  assert.equal(SHIPPING_PAY_ON_DELIVERY, 'پرداخت درب منزل')
})

test('price calculation no longer depends on delivery-date configuration or client index', async () => {
  const h = harness()
  const result = await h.actions.calcDeliveryDateAndPrice({ items: [{ ...item, price: 1200 }], shippingAddress: address, deliveryDateIndex: 99999 })
  assert.equal(result.totalPrice, 2400)
  assert.equal(result.shippingPrice, 0)
  assert.equal(result.deliveryDateIndex, undefined)
})

test('cart hydration and clearing remove old carrier charges from the stored total', async () => {
  let options
  const store = load('hooks/use-cart-store.ts', {
    'zustand/middleware': { persist: (initializer, config) => { options = config; return initializer } },
    '@/lib/actions/order.actions': { calcDeliveryDateAndPrice: async ({ items }) => calculateTipaxTotals(items) },
  }).default
  const merged = options.merge({ cart: cart({ deliveryDateIndex: 2 }) }, store.getState())
  assert.equal(merged.cart.totalPrice, 2)
  assert.equal(merged.cart.shippingPrice, 0)
  assert.equal(merged.cart.shippingMethod, TIPAX_SHIPPING_METHOD)
  assert.equal(merged.cart.deliveryDateIndex, undefined)
  store.setState(merged)
  store.getState().clearCart()
  assert.equal(store.getState().cart.totalPrice, 0)
  assert.equal(store.getState().cart.shippingPrice, 0)
})

test('payment and order details render Tipax consistently while preserving old shipping displays', () => {
  const React = require('react')
  const { renderToStaticMarkup } = require('react-dom/server')
  const Price = ({ price }) => React.createElement('span', { 'data-price': price }, String(price))
  const mocks = {
    'next/image': ({ src, alt }) => React.createElement('img', { src, alt }),
    'next/link': ({ href, children }) => React.createElement('a', { href }, children),
    'next/navigation': { useRouter: () => ({ push() {} }) },
    '@/hooks/use-toast': { useToast: () => ({ toast() {} }) },
    '@/lib/actions/order.actions': {},
    '@/components/shared/product/product-price': Price,
    '../product/product-price': Price,
    '../action-button': () => null,
    './stripe-form': () => null,
    '@paypal/react-paypal-js': {},
    '@stripe/react-stripe-js': {},
    '@stripe/stripe-js/pure': { loadStripe: () => null },
  }
  for (const file of ['app/[locale]/checkout/[id]/payment-form.tsx', 'components/shared/order/order-details-form.tsx']) {
    const Component = load(file, mocks).default
    const base = { ...cart(), _id: orderId, isPaid: false, itemsPrice: 2400, totalPrice: 2400, shippingPrice: 0 }
    const tipax = renderToStaticMarkup(React.createElement(Component, { order: base, isAdmin: false }))
    assert.ok(tipax.includes(TIPAX_SHIPPING_METHOD), file)
    assert.ok(tipax.includes(SHIPPING_PAY_ON_DELIVERY), file)
    assert.ok(!tipax.includes('ارسال رایگان'), file)
    for (const shippingPrice of [0, 75]) {
      const html = renderToStaticMarkup(React.createElement(Component, { order: { ...base, shippingMethod: undefined, shippingPrice, expectedDeliveryDate: new Date('2020-01-01') }, isAdmin: false }))
      assert.ok(!html.includes(SHIPPING_PAY_ON_DELIVERY), file)
      assert.ok(shippingPrice === 0 ? html.includes('ارسال رایگان') : html.includes('data-price="75"'), file)
      assert.ok(html.includes('2020'), file)
    }
  }
})

test('receipt and review emails show deferred shipping only for new Tipax orders', async () => {
  const { renderToStaticMarkup } = require('react-dom/server')
  for (const file of ['emails/purchase-receipt.tsx', 'emails/ask-review-order-items.tsx']) {
    const Email = load(file, { '@/lib/actions/setting.actions': { getSetting: async () => ({ site: { url: 'https://viora-store.ir' } }) } }).default
    const order = { ...cart(), _id: orderId, createdAt: new Date(), itemsPrice: 2400, totalPrice: 2400, shippingPrice: 0 }
    const tipax = renderToStaticMarkup(await Email({ order }))
    assert.ok(tipax.includes(TIPAX_SHIPPING_METHOD), file)
    assert.ok(tipax.includes(SHIPPING_PAY_ON_DELIVERY), file)
    const legacy = renderToStaticMarkup(await Email({ order: { ...order, shippingMethod: undefined, shippingPrice: 75 } }))
    assert.ok(!legacy.includes(SHIPPING_PAY_ON_DELIVERY), file)
    assert.ok(!legacy.includes(TIPAX_SHIPPING_METHOD), file)
    assert.ok(legacy.includes('75'), file)
  }
})
