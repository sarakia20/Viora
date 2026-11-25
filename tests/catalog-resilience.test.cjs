const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const load = require('./helpers/load-typescript.cjs')
const { normalizeProduct, getProductStock, hasProductPrice } = load('lib/product-display.ts')
const { productSearchPattern } = load('lib/product-search.ts')
const { PRODUCT_IMAGE_PLACEHOLDER } = load('lib/store-images.ts')

test('normalizes sparse catalog fields without changing the original document', () => {
  const raw = {
    images: [null, '/valid.webp', 'bad-url', 12], tags: null, sizes: undefined,
    colors: ['مشکی', null], variants: null, avgRating: null, price: '1200',
    listPrice: Infinity, countInStock: null, stock: '4',
  }
  const product = normalizeProduct(raw)
  assert.deepEqual(product.images, ['/valid.webp'])
  assert.deepEqual(product.tags, [])
  assert.deepEqual(product.sizes, [])
  assert.deepEqual(product.colors, ['مشکی'])
  assert.deepEqual(product.variants, [])
  assert.equal(product.avgRating, 0)
  assert.equal(product.price, 1200)
  assert.equal(product.listPrice, 0)
  assert.equal(getProductStock(product), 4)
  assert.equal(raw.tags, null)
})

test('dedicated and shared variant stock preserve explicit zero and exact offer price', () => {
  const product = normalizeProduct({
    price: 9000, countInStock: 8, stock: 99, avgRating: '4.5',
    variants: [
      null,
      { color: 'سفید', price: 1200, listPrice: 1500, countInStock: 0, stock: 99 },
      { color: 'مشکی', price: 2500, stock: 3 },
      { color: 'طلایی', price: 3200, countInStock: 0, usesProductStock: true },
      { color: 'کروم', price: 0, stock: 3 },
    ],
  })
  assert.equal(product.avgRating, 4.5)
  assert.deepEqual(product.variants.map((variant) => getProductStock(product, variant)), [0, 3, 8, 3])
  assert.deepEqual(product.variants.map((variant) => variant.price), [1200, 2500, 3200, 0])
  assert.equal(hasProductPrice(product.variants[3].price), false)
  assert.equal(normalizeProduct({ price: 5000, variants: [null] }).price, 0)
  assert.equal(getProductStock(normalizeProduct({ countInStock: 0, stock: 3 })), 0)
})

test('Persian search matches both letter forms and optional spacing, with literal punctuation', () => {
  const matches = (query, name) => new RegExp(productSearchPattern(query), 'iu').test(name)
  assert.equal(matches('  شیر   سینک ', 'شير‌سينك مدل A'), true)
  assert.equal(matches('شير‌سينك', 'شیرسینک مدل A'), true)
  assert.equal(matches('سیمبر (۲)+', 'سيمبر (۲)+'), true)
  assert.equal(matches('.*', 'سیمبر'), false)
  assert.equal(matches('[(', 'مدل [('), true)
  assert.equal(matches('a'.repeat(129), 'a'.repeat(140)), false)
  assert.equal(productSearchPattern(' ‌ '), '')
})

test('image switches to the placeholder after load failure and resets when src changes', () => {
  let failed
  const ProductImage = load('components/shared/product/product-image.tsx', {
    react: { useState: () => [failed, (value) => { failed = value }] },
    'next/image': 'img',
  }).default
  const render = (src, fallback) => ProductImage({ src, alt: 'sample', fallback })
  assert.equal(render(undefined).props.src, PRODUCT_IMAGE_PLACEHOLDER)
  assert.equal(render('/missing.webp').props.src, '/missing.webp')
  render('/missing.webp').props.onError({})
  assert.equal(render('/missing.webp').props.src, PRODUCT_IMAGE_PLACEHOLDER)
  assert.equal(render('/missing.webp', false), null)
  assert.equal(render('/second.webp').props.src, '/second.webp')
})

test('a complete legacy card and incomplete cards render together with safe offers', () => {
  const ProductCard = load('components/shared/product/product-card.tsx', {
    'next/link': 'a',
    'next/image': ({ src }) => React.createElement('img', { src, alt: '' }),
    'next-intl': { useLocale: () => 'fa' },
    '@/hooks/use-setting-store': (select) => select({ setting: { availableCurrencies: [], currency: '' } }),
    './add-to-cart': ({ item }) => React.createElement('button', { 'data-price': item.price }),
  }).default
  const product = { _id: 'sample', slug: 'sample', name: 'نمونه', category: 'سینک' }
  const markup = renderToStaticMarkup([
    { ...product, price: 1200, stock: 2, images: ['/sample.webp'] },
    { ...product, price: null, stock: 2, images: null, avgRating: null },
    { ...product, price: 2400, countInStock: 0, stock: 3, variants: [] },
  ].map((value, index) => React.createElement(ProductCard, { key: index, product: value })))
  assert.equal((markup.match(/data-price=/g) ?? []).length, 1)
  assert.match(markup, /data-price="1200"/)
  assert.match(markup, /استعلام قیمت/)
  assert.match(markup, /ناموجود/)
  assert.match(markup, /product-placeholder\.svg/)
})

test('search isolates a bad product and logs only its identifiers', async () => {
  const documents = [
    { _id: 'broken', slug: '\ud800', name: 'bad', description: 'not for logs' },
    { _id: 'good', slug: 'sample', name: 'شير‌سينك', images: null, tags: null, price: 1000 },
  ]
  const logs = []
  let filter
  const query = { sort: () => query, skip: () => query, limit: () => query, lean: async () => documents }
  const actions = load('lib/actions/product.actions.ts', {
    '@/lib/data': { products: [] },
    '@/lib/db': { connectToDatabase: async () => {} },
    '@/lib/db/models/product.model': { countDocuments: async () => 2, find: (value) => { filter = value; return query } },
    'next/cache': {},
    '../auth-guard': {},
    './setting.actions': { getSetting: async () => ({ common: { pageSize: 9 } }) },
  }, { console: { error: (...args) => logs.push(args) } })
  const result = await actions.getAllProducts({ query: 'شیر سینک', category: 'all', tag: 'all', page: 1 })
  assert.equal(filter.name.$regex, productSearchPattern('شیر سینک'))
  assert.deepEqual(result.products.map(({ _id, images, tags }) => ({ _id, images, tags })), [{ _id: 'good', images: [], tags: [] }])
  assert.deepEqual(logs[0][1], { productId: 'broken', slug: '\ud800' })
})
