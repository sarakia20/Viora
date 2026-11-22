/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS repository test loader. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const React = require('react')
const load = require('./helpers/load-typescript.cjs')
const seo = load('lib/product-seo.ts')
const product = {
  _id: 'product-id', name: 'شیر مدل تست', slug: 'شیر تست', brand: 'برند واقعی',
  category: 'شیرآلات', subCategory: 'شیر آشپزخانه', description: 'جنس: استیل',
  images: ['/front.webp'], variants: [], colors: [], sizes: [], tags: [],
  isPublished: true, price: 12500, listPrice: 13000, countInStock: 3,
  avgRating: 5, numReviews: 100, ratingDistribution: [],
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [tree, ...nodes(tree.props?.children)]
}
function loadPage(value = product, error, relatedProducts = []) {
  const file = 'app/[locale]/(root)/product/[slug]/page.tsx'
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const mocks = {}
  const Component = () => null
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue
    const entry = { __esModule: true, default: Component }
    const bindings = statement.importClause.namedBindings
    if (bindings && ts.isNamedImports(bindings)) {
      for (const binding of bindings.elements) entry[(binding.propertyName || binding.name).text] = Component
    }
    mocks[statement.moduleSpecifier.text] = entry
  }
  Object.assign(mocks, {
    react: { ...React, cache: fn => fn },
    '@/lib/product-seo': seo,
    '@/lib/site-url': load('lib/site-url.ts'),
    '@/lib/category-config': load('lib/category-config.ts'),
    '@/lib/actions/product.actions': {
      async getProductBySlug() { if (error) throw error; return value },
      async getRelatedProductsByCategory() { return { data: relatedProducts } },
    },
    '@/lib/utils': { generateId: () => 'id', round2: value => value },
    'next-intl/server': { getTranslations: async () => key => key },
    'next/navigation': { notFound() { throw new Error('NOT_FOUND') } },
  })
  return load(file, mocks, { URLSearchParams })
}
const props = () => ({ params: Promise.resolve({ slug: product.slug }), searchParams: Promise.resolve({}) })

test('metadata preserves short real descriptions and falls back only to recorded facts', async () => {
  const metadata = await loadPage().generateMetadata(props())
  assert.equal(metadata.description, product.description)
  assert.ok(metadata.title.includes(product.name))
  assert.equal(metadata.alternates.canonical, 'https://viora-store.ir/product/' + encodeURIComponent(product.slug))
  const fallback = await loadPage({ ...product, description: '' }).generateMetadata(props())
  assert.equal(fallback.description, [product.name, product.brand, product.category].join('؛ '))
})

test('offers use real valid prices and stock; no ratings inferred from counters', () => {
  const schema = seo.getProductJsonLd(product)
  assert.equal(schema.offers[0].price, 125000)
  assert.equal(schema.offers[0].priceCurrency, 'IRR')
  assert.equal(schema.offers[0].availability, 'https://schema.org/InStock')
  assert.ok(!('aggregateRating' in schema))
  assert.ok(!('review' in schema))
  for (const price of [NaN, Infinity, -1, 0, 0.1, 12500.5, Number.MAX_VALUE, undefined]) {
    assert.ok(!('offers' in seo.getProductJsonLd({ ...product, price })))
  }
  assert.ok(!('offers' in seo.getProductJsonLd({ ...product, countInStock: 0 })), 'hidden base price is not advertised')
  assert.equal(seo.getProductJsonLd({ ...product, isPublished: false }), null)
})

test('variant offers use variant price and stock without falling back to the base price', () => {
  const variants = [
    { color: 'کروم', image: '/chrome.webp', price: 1000, countInStock: 0 },
    { color: 'مشکی', image: '/black.webp', price: 2000, countInStock: 4 },
    { color: 'بدون قیمت معتبر', image: '', price: NaN, countInStock: 3 },
  ]
  const schema = seo.getProductJsonLd({ ...product, price: 999999, variants })
  assert.deepEqual(schema.offers.map(offer => offer.price), [10000, 20000])
  assert.deepEqual(schema.offers.map(offer => offer.availability), ['https://schema.org/OutOfStock', 'https://schema.org/InStock'])
  assert.equal(schema.offers[0].name, 'کروم')
  assert.ok(schema.image.includes('https://viora-store.ir/black.webp'))
  assert.ok(!('offers' in seo.getProductJsonLd({ ...product, variants: [variants[2]] })))
})

test('image URLs omit empty and unsafe values, preserve variant fallback and deduplicate', () => {
  const images = seo.getProductImageUrls({ images: ['', '/front.webp', '/front.webp', 'javascript:alert(1)'],
    variants: [{ image: '' }, { image: '/black.webp' }] })
  assert.deepEqual(images, ['https://viora-store.ir/front.webp', 'https://viora-store.ir/black.webp'])
})

test('page produces exactly one Product and Breadcrumb JSON-LD, safely serialized', async () => {
  const malicious = { ...product, name: 'مدل </script><script>alert(1)</script>' }
  const tree = nodes(await loadPage(malicious).default(props()))
  const scripts = tree.filter(node => node.type === 'script')
  assert.equal(scripts.length, 2)
  const schemas = scripts.map(node => {
    const raw = node.props.dangerouslySetInnerHTML.__html
    assert.ok(!raw.includes('<'))
    return JSON.parse(raw)
  })
  assert.equal(schemas[0]['@type'], 'Product')
  assert.equal(schemas[0].name, malicious.name)
  assert.equal(schemas[1]['@type'], 'BreadcrumbList')
  assert.equal(schemas[1].itemListElement[1].item, 'https://viora-store.ir/category/faucets')
  assert.equal(tree.filter(node => node.type === 'h1').length, 1)
})

test('product page renders the related products once and in their returned order', async () => {
  const related = [{ ...product, slug: 'related-first' }, { ...product, slug: 'related-second' }]
  const tree = nodes(await loadPage(product, undefined, related).default(props()))
  const sliders = tree.filter(node => node.props?.products === related)
  assert.equal(sliders.length, 1)
  assert.equal(sliders[0].props.title, 'محصولات مشابه')
})

test('missing/unpublished products are not rendered and database errors remain errors', async () => {
  for (const page of [loadPage({ ...product, isPublished: false }), loadPage(null, new Error('Product not found'))]) {
    await assert.rejects(page.generateMetadata(props()), /NOT_FOUND/)
    await assert.rejects(page.default(props()), /NOT_FOUND/)
  }
  await assert.rejects(loadPage(null, new Error('database unavailable')).default(props()), /database unavailable/)
})

test('Organization/WebSite use only persisted optional settings and stable linked identities', async () => {
  let site = null
  let fail = false
  const store = load('lib/store-schema.ts', {
    'next/cache': { unstable_cache: fn => fn },
    '@/lib/db': { async connectToDatabase() { if (fail) throw new Error('database unavailable') } },
    '@/lib/db/models/setting.model': { findOne() {
      return { select() { return this }, async lean() { return site ? { site } : null } }
    } },
  })
  const empty = await store.getStoreJsonLd()
  assert.equal(empty['@graph'].length, 2)
  assert.equal(empty['@graph'][0].name, 'ویورا')
  for (const key of ['telephone', 'email', 'address', 'logo', 'sameAs']) assert.ok(!(key in empty['@graph'][0]))
  site = { logo: '/real-logo.webp', phone: 'recorded-phone', email: 'recorded@example.test', address: 'آدرس ثبت‌شده' }
  const graph = (await store.getStoreJsonLd())['@graph']
  assert.equal(graph[0].logo, 'https://viora-store.ir/real-logo.webp')
  assert.equal(graph[0].telephone, site.phone)
  assert.equal(graph[0].address, site.address)
  assert.equal(graph[1].publisher['@id'], graph[0]['@id'])
  assert.equal(store.buildStoreJsonLd({ logo: 'javascript:alert(1)' })['@graph'][0].logo, undefined)
  fail = true
  assert.deepEqual(await store.getStoreJsonLd(), empty, 'optional settings failure does not break storefront')
})

test('public product and related queries require isPublished and exclude the current product', async () => {
  let lookup, relatedFilter
  const actions = load('lib/actions/product.actions.ts', {
    '@/lib/data': { products: [] },
    '@/lib/db': { connectToDatabase: async () => {} },
    '@/lib/db/models/product.model': {
      async findOne(filter) { lookup = filter; return null },
      find(filter) { relatedFilter = filter; return { sort() { return this }, skip() { return this }, limit() { return [] } } },
      countDocuments: async () => assert.fail('Related products are rendered without a count'),
    },
    './setting.actions': { getSetting: async () => ({ common: { pageSize: 4 } }) },
    '../auth-guard': {},
  })
  await assert.rejects(actions.getProductBySlug('missing'), /Product not found/)
  assert.deepEqual(lookup, { slug: 'missing', isPublished: true })
  await actions.getRelatedProductsByCategory({ category: 'شیرآلات', productId: 'current', page: 1 })
  assert.equal(relatedFilter.isPublished, true)
  assert.equal(relatedFilter._id.$ne, 'current')
})
