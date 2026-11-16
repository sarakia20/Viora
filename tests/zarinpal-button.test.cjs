// Render the real server page + client payment component with synthetic orders.
// No production data, credentials, HTTP gateway calls or browser transport.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const load = require('./helpers/load-typescript.cjs')

function harness({ paymentMethod = 'ZarinPal', isPaid = false, pending = false } = {}) {
  const id = '0123456789abcdef01234567'
  const order = {
    _id: id, paymentMethod, isPaid, items: [], itemsPrice: 2400, shippingPrice: 0, totalPrice: 2400,
    shippingAddress: { fullName: 'مشتری', street: 'آدرس', city: 'شیراز', province: 'فارس', postalCode: '1234567890', country: 'Iran' },
  }
  const submitted = []
  const mocks = {
    '@/auth': { auth: async () => ({ user: { id: 'owner' } }) },
    '@/lib/actions/order.actions': {
      getOrderById: async () => order,
      startZarinPalPayment: async (...args) => { submitted.push(args) },
    },
    'next/navigation': {
      useRouter: () => ({ push() {} }),
      redirect(url) { throw Object.assign(new Error('Next redirect simulated'), { url }) },
      notFound() { throw new Error('Not found') },
    },
    '@/hooks/use-toast': { useToast: () => ({ toast() {} }) },
    '@paypal/react-paypal-js': {}, '@stripe/react-stripe-js': {},
    '@stripe/stripe-js/pure': { loadStripe: () => null },
    './stripe-form': () => null,
    '@/components/shared/product/product-price': ({ price }) => React.createElement('span', null, price),
    'react-dom': { useFormStatus: () => ({ pending }) },
  }
  const Page = load('app/[locale]/checkout/[id]/page.tsx', mocks).default
  return { id, submitted, order, page: paymentError => Page({ params: Promise.resolve({ id }), searchParams: Promise.resolve({ paymentError }) }) }
}

test('unpaid canonical and Persian online orders render an enabled ZarinPal submit in both responsive summaries', async () => {
  for (const paymentMethod of ['ZarinPal', 'پرداخت آنلاین']) {
    const h = harness({ paymentMethod })
    const page = await h.page()
    const form = page.props.zarinpalPayment
    assert.equal(form.type, 'form')
    assert.equal(typeof form.props.action, 'function')
    const html = renderToStaticMarkup(page)
    const buttons = html.match(/<button\b[^>]*>پرداخت با زرین‌پال<\/button>/g) || []
    assert.equal(buttons.length, 2, html)
    assert.ok(buttons.every(button => button.includes('type="submit"') && !/\sdisabled(?:=|[\s>])/.test(button)))
    assert.ok(html.includes('پایان ثبت سفارش')) // Footer is not a payment-completion status.
    await form.props.action()
    assert.deepEqual(h.submitted, [[h.id]]) // Only order ID is bound; no browser-supplied amount.
  }
})

test('payment request pending disables submit and shows progress', async () => {
  const html = renderToStaticMarkup(await harness({ pending: true }).page())
  const buttons = html.match(/<button\b[^>]*>در حال اتصال به درگاه\.\.\.<\/button>/g) || []
  assert.equal(buttons.length, 2)
  assert.ok(buttons.every(button => /\sdisabled(?:=|[\s>])/.test(button) && button.includes('aria-busy="true"')))
})

test('payment failure displays a safe Persian alert and keeps an enabled retry form', async () => {
  const html = renderToStaticMarkup(await harness({ paymentMethod: 'پرداخت آنلاین' }).page('connection'))
  assert.ok(html.includes('role="alert"'))
  assert.match(html, /ارتباط با درگاه پرداخت برقرار نشد|شروع پرداخت ناموفق بود/)
  assert.ok(html.includes('دوباره تلاش کنید'))
  const button = html.match(/<button\b[^>]*>پرداخت با زرین‌پال<\/button>/)?.[0]
  assert.ok(button && !/\sdisabled(?:=|[\s>])/.test(button))
})

test('paid orders have no payment form and redirect to their account order', async () => {
  for (const paymentMethod of ['ZarinPal', 'پرداخت آنلاین']) {
    const h = harness({ paymentMethod, isPaid: true })
    const page = await h.page()
    assert.equal(page.props.zarinpalPayment, null)
    assert.throws(() => renderToStaticMarkup(page), error => error.url === `/account/orders/${h.id}`)
    assert.equal(h.submitted.length, 0)
  }
})

test('unrelated and unknown payment methods never receive a ZarinPal form', async () => {
  for (const paymentMethod of ['PayPal', 'Cash On Delivery', 'online', 'پرداخت حضوری', '']) {
    const page = await harness({ paymentMethod }).page()
    assert.equal(page.props.zarinpalPayment, null)
  }
})
