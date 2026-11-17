/* eslint-disable @typescript-eslint/no-require-imports -- Match the repository's CommonJS test loader. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const load = require('./helpers/load-typescript.cjs')

const pageFile = 'app/[locale]/(root)/category/[slug]/page.tsx'
const config = load('lib/category-config.ts')
const props = (slug, searchParams = {}) => ({
  params: Promise.resolve({ slug }), searchParams: Promise.resolve(searchParams),
})
function pageModule(totalProducts = 5, totalPages = 3) {
  const calls = []
  const pageExports = load(pageFile, {
    react: { ...React, cache(fn) {
      const memo = new Map()
      return (...args) => {
        const key = JSON.stringify(args)
        if (!memo.has(key)) memo.set(key, fn(...args))
        return memo.get(key)
      }
    } },
    'next/navigation': {
      notFound() { throw new Error('NOT_FOUND') },
      permanentRedirect(url) { throw new Error(`REDIRECT_308:${url}`) },
    },
    '@/components/shared/pagination': () => null,
    '@/components/shared/product/product-card': () => null,
    '@/lib/actions/product.actions': { async getAllProducts(params) {
      calls.push(params)
      return { products: [], totalProducts, totalPages }
    } },
  }, { URLSearchParams })
  return { ...pageExports, calls }
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [tree, ...nodes(tree.props?.children)]
}

test('verified categories map to one landing each; unknown and prototype slugs are rejected', () => {
  assert.equal(config.getCategoryLandingPath('فلاش تانک'), '/category/flush-tanks')
  assert.equal(config.getCategoryLandingPath('هود'), '/category/hoods')
  assert.equal(config.getCategoryLandingPath('گاز'), '/category/cooktops')
  assert.equal(config.getCategoryLandingPath('اجاق گاز'), '/category/cooktops')
  assert.equal(config.getCategoryLandingPath('سرامیک'), undefined)
  for (const slug of ['ceramic', 'constructor', '__proto__', 'missing']) {
    assert.equal(config.getCategoryConfig(slug), undefined)
  }
})

test('new and existing landings have metadata, one H1 and canonical breadcrumb', async () => {
  for (const slug of Object.keys(config.categoryConfig)) {
    const page = pageModule()
    const metadata = await page.generateMetadata(props(slug, { page: '2', sort: 'newest', utm_source: 'test' }))
    assert.equal(metadata.alternates.canonical, `https://viora-store.ir/category/${slug}?page=2`)
    assert.ok(metadata.title.absolute)
    assert.ok(metadata.description)
    assert.equal(metadata.robots.index, true)
    const tree = nodes(await page.default(props(slug, { page: '2' })))
    assert.equal(tree.filter(node => node.type === 'h1').length, 1)
    const breadcrumb = JSON.parse(tree.find(node => node.type === 'script').props.dangerouslySetInnerHTML.__html)
    assert.equal(breadcrumb.itemListElement[1].item, `https://viora-store.ir/category/${slug}`)
    assert.equal(page.calls.length, 1, 'metadata and body share the query')
    const category = config.getCategoryConfig(slug)
    assert.deepEqual(page.calls[0].category, category.productCategories ?? category.productCategory)
  }
})

test('invalid and out-of-range pages fail in both metadata and body', async () => {
  const invalid = ['', '0', '-1', '1.5', 'abc', '1e2', ' 2', ['2', '3'], '9007199254740992']
  for (const value of invalid) {
    const page = pageModule()
    await assert.rejects(page.generateMetadata(props('sink', { page: value })), /NOT_FOUND/)
    await assert.rejects(page.default(props('sink', { page: value })), /NOT_FOUND/)
    assert.equal(page.calls.length, 0)
  }
  const page = pageModule()
  await assert.rejects(page.generateMetadata(props('sink', { page: '9999' })), /NOT_FOUND/)
  await assert.rejects(page.default(props('sink', { page: '9999' })), /NOT_FOUND/)
  await assert.rejects(page.default(props('constructor')), /NOT_FOUND/)
})

test('page=1 and leading zeros redirect to standard URLs and preserve other parameters', async () => {
  const page = pageModule()
  await assert.rejects(page.default(props('sink', { page: '1' })), /REDIRECT_308:\/category\/sink$/)
  await assert.rejects(page.generateMetadata(props('sink', { page: '002', utm_source: 'test', brand: ['a', 'b'] })),
    /REDIRECT_308:\/category\/sink\?utm_source=test&brand=a&brand=b&page=2$/)
})

test('new landings with no published products return notFound', async () => {
  const page = pageModule(0, 0)
  for (const slug of ['flush-tanks', 'hoods', 'cooktops']) {
    await assert.rejects(page.generateMetadata(props(slug)), /NOT_FOUND/)
    await assert.rejects(page.default(props(slug)), /NOT_FOUND/)
  }
  assert.ok(await page.default(props('sink')), 'existing empty-category behavior is preserved')
})

test('sitemap includes only populated new landings and published product query', async () => {
  let filter
  const sitemap = load('app/sitemap.ts', {
    'next/cache': { unstable_cache: fn => fn },
    '@/lib/db': { connectToDatabase: async () => {} },
    '@/lib/db/models/product.model': { find(value) {
      filter = value
      return { select() { return this }, async lean() {
        return [{ slug: 'test-gas', category: 'گاز' }, { slug: 'test-flush', category: 'فلاش تانک' }]
      } }
    } },
  }).default
  const urls = (await sitemap()).map(item => item.url)
  assert.deepEqual(filter, { isPublished: true })
  assert.ok(urls.includes('https://viora-store.ir/category/cooktops'))
  assert.ok(urls.includes('https://viora-store.ir/category/flush-tanks'))
  assert.ok(!urls.includes('https://viora-store.ir/category/hoods'))
  assert.ok(!urls.some(url => /ceramic/.test(url)))
  assert.equal(new Set(urls).size, urls.length)
})

test('product listing uses exact published category values and retains filters and sorting', async () => {
  let countFilter, findFilter, order, skip, finds = 0
  const actions = load('lib/actions/product.actions.ts', {
    '@/lib/data': { products: [] },
    '@/lib/db': { connectToDatabase: async () => {} },
    '@/lib/db/models/product.model': {
      async countDocuments(filter) { countFilter = filter; return 8 },
      find(filter) {
        finds++
        findFilter = filter
        return {
          sort(value) { order = value; return this },
          skip(value) { skip = value; return this },
          limit() { return this },
          async lean() { return [{ _id: 'one' }] },
        }
      },
    },
    '@/lib/actions/setting.actions': { getSetting: async () => ({ common: { pageSize: 4 } }) },
    './setting.actions': { getSetting: async () => ({ common: { pageSize: 4 } }) },
    '@/lib/auth-guard': {}, '../auth-guard': {},
  })
  const args = { category: ['گاز', 'اجاق گاز'], query: 'all', subCategory: 'اجاق گاز استیل',
    brand: 'test', tag: 'all', price: '100-200', rating: '4', sort: 'price-low-to-high', page: 2 }
  await actions.getAllProducts(args)
  assert.deepEqual(findFilter, countFilter)
  assert.deepEqual(findFilter.category, { $in: ['گاز', 'اجاق گاز'] })
  assert.equal(findFilter.isPublished, true)
  assert.equal(findFilter.subCategory, 'اجاق گاز استیل')
  assert.equal(findFilter.brand, 'test')
  assert.deepEqual(findFilter.price, { $gte: 100, $lte: 200 })
  assert.deepEqual(findFilter.avgRating, { $gte: 4 })
  assert.deepEqual(order, { price: 1, _id: -1 })
  assert.equal(skip, 4)
  const outside = await actions.getAllProducts({ ...args, page: 9999 })
  assert.equal(finds, 1, 'out-of-range requests do not run a large skip query')
  assert.equal(outside.products.length, 0)
  await actions.getAllProducts({ ...args, category: 'سینک', page: 1 })
  assert.equal(findFilter.category, 'سینک', 'existing exact category filter remains unchanged')
})

test('old search URLs remain usable and point to new landings without changing subcategory canonicals', async () => {
  const search = load('app/[locale]/(root)/search/page.tsx', {
    '@/components/shared/pagination': () => null,
    '@/components/shared/product/product-card': () => null,
    '@/lib/actions/product.actions': {},
    '@/components/shared/product/product-sort-selector': () => null,
    '@/components/shared/product/rating': () => null,
    '@/components/shared/collapsible-on-mobile': () => null,
    '@/components/shared/search-sidebar': () => null,
    '@/components/shared/mobile-search-controls': () => null,
    'next-intl/server': {},
  }, { URLSearchParams })
  for (const category of ['فلاش تانک', 'هود', 'گاز', 'اجاق گاز', 'سینک', 'شیرآلات', 'توالت فرنگی']) {
    const metadata = await search.generateMetadata({ searchParams: Promise.resolve({ category }) })
    assert.equal(metadata.alternates.canonical, `https://viora-store.ir${config.getCategoryLandingPath(category)}`)
    assert.equal(metadata.robots.index, false)
  }
  const subcategory = await search.generateMetadata({ searchParams: Promise.resolve({
    category: 'اجاق گاز', subCategory: 'اجاق گاز استیل',
  }) })
  assert.equal(new URL(subcategory.alternates.canonical).pathname, '/search')
  assert.equal(subcategory.robots.index, true)
})

test('pagination still renders real links for a valid second page', () => {
  const { renderToStaticMarkup } = require('react-dom/server')
  const Pagination = load('components/shared/pagination.tsx', {
    'next/navigation': { usePathname: () => '/category/cooktops',
      useSearchParams: () => new URLSearchParams('page=2&utm_source=test') },
    'next/link': { __esModule: true, default: ({ children, prefetch, ...args }) => {
      void prefetch
      return React.createElement('a', args, children)
    } },
    'next-intl': { useTranslations: () => key => key },
    '../ui/button': { Button: ({ asChild, children, variant, size, ...args }) => {
      void variant
      void size
      return asChild ? React.cloneElement(children, args) : React.createElement('button', args, children)
    } },
  }, { URLSearchParams }).default
  const html = renderToStaticMarkup(React.createElement(Pagination, { page: 2, totalPages: 3 }))
  assert.match(html, /href="\/category\/cooktops\?page=3&amp;utm_source=test"/)
  assert.match(html, /rel="prev"/)
  assert.match(html, /rel="next"/)
})

test('desktop and mobile menus target verified landings while preserving ceramic search', () => {
  for (const [group, paths] of [
    ['چینی آلات بهداشتی', ['/category/flush-tanks', '/category/toilet']],
    ['تجهیزات آشپزخانه', ['/category/hoods', '/category/cooktops', '/category/sink']],
    ['کاشی و سرامیک', ['/search?category=' + encodeURIComponent('سرامیک')]],
  ]) {
    const Sidebar = load('components/shared/header/sidebar.tsx', {
      react: { ...React, useEffect() {}, useState(initial) {
        return [typeof initial === 'boolean' ? true : group, () => {}]
      } },
    }).default
    const tree = nodes(Sidebar())
    for (const path of paths) {
      assert.ok(tree.filter(node => node.props?.href === path).length >= 2, path)
    }
  }
})
