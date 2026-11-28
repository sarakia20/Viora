/* eslint-disable @typescript-eslint/no-require-imports -- Match the repository's CommonJS test loader. */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const load = require('./helpers/load-typescript.cjs')

const pageFile = 'app/[locale]/(root)/category/[slug]/page.tsx'
const previewFile = 'app/[locale]/(root)/category/[slug]/category-guide-preview.tsx'
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

test('homepage group landings list all stored member categories with no subcategory filter', async () => {
  for (const [group, slug, categories] of [
    ['تجهیزات آشپزخانه', 'kitchen-equipment', ['تجهیزات آشپزخانه', 'هود', 'سینک', 'گاز', 'اجاق گاز', 'فر', 'ماکروویو']],
    ['چینی آلات بهداشتی', 'sanitary-ware', ['چینی آلات بهداشتی', 'توالت فرنگی', 'توالت ایرانی', 'روشویی']],
    ['کاشی و سرامیک', 'tiles-and-ceramics', ['کاشی و سرامیک', 'کاشی', 'سرامیک', 'کاشی دیوار', 'سرامیک کف']],
  ]) {
    const page = pageModule()
    assert.equal(config.getCategoryGroupLandingPath(group), `/category/${slug}`)
    await page.default(props(slug))
    assert.deepEqual(page.calls[0].category, categories)
    assert.equal(page.calls[0].subCategory, 'all')
  }
  assert.equal(config.getCategoryLandingPath('سینک'), '/category/sink')
  assert.equal(config.getCategoryLandingPath('فر'), undefined)
})

test('every category renders one complete guide with its original title, paragraphs and links', async () => {
  for (const category of Object.values(config.categoryConfig)) {
    const page = pageModule()
    const tree = nodes(await page.default(props(category.slug)))
    const guides = tree.filter(node => node.props?.['aria-labelledby'] === 'category-guide-title')
    assert.equal(guides.length, 1, category.slug)
    assert.equal(guides[0].props.dir, 'rtl')
    const guide = nodes(guides[0])
    assert.equal(guide.find(node => node.type === 'h2').props.children.at(-1), category.guideTitle)
    assert.deepEqual(guide.filter(node => node.type === 'p').map(node => node.props.children), category.guideParagraphs)
    assert.deepEqual(guide.filter(node => node.props?.href).map(node => ({
      href: node.props.href, label: node.props.children,
    })), category.guideLinks ?? [])
    const html = renderToStaticMarkup(guides[0])
    for (const paragraph of category.guideParagraphs) {
      assert.equal(html.split(`<p>${paragraph}</p>`).length, 2)
    }
    const secondPage = nodes(await page.default(props(category.slug, { page: '2' })))
    assert.ok(!secondPage.some(node => node.props?.id === 'category-guide-title'))
  }
})

test('guide preview toggles without replacing content and adapts to text wrapping', () => {
  const content = {
    offsetHeight: 224,
    getBoundingClientRect: () => ({ top: 0 }),
    children: [{ getBoundingClientRect: () => ({ top: 0, bottom: 224 }) }],
  }
  const paragraphs = React.createElement('p', null, 'متن راهنمای خرید')
  const state = []
  let cursor, effect, resize, disconnected
  const Preview = load(previewFile, {
    react: { ...React, useId: () => 'guide-preview', useRef: () => ({ current: content }),
      useEffect(callback) { effect = callback },
      useState(initial) {
        const index = cursor++
        if (!(index in state)) state[index] = initial
        return [state[index], (value) => {
          state[index] = typeof value === 'function' ? value(state[index]) : value
        }]
      },
    },
  }, {
    getComputedStyle: () => ({ lineHeight: '28px' }),
    ResizeObserver: class {
      constructor(callback) { resize = callback }
      observe(target) { assert.equal(target, content) }
      disconnect() { disconnected = true }
    },
  }).default
  const render = () => {
    cursor = 0
    const tree = nodes(Preview({ children: paragraphs }))
    return {
      panel: tree.find(node => node.props?.id === 'guide-preview'),
      button: tree.find(node => node.type === 'button'),
    }
  }
  assert.equal(render().panel.props.style, undefined)
  const cleanup = effect()
  let { panel, button } = render()
  assert.equal(panel.props.style.maxHeight, 112)
  assert.equal(button.props['aria-controls'], panel.props.id)
  assert.equal(button.props['aria-expanded'], false)
  assert.equal(button.props.children[0], 'مشاهده بیشتر')
  button.props.onClick()

  ;({ panel, button } = render())
  assert.equal(panel.props.style.maxHeight, 224)
  assert.equal(button.props['aria-expanded'], true)
  assert.equal(button.props.children[0], 'مشاهده کمتر')
  assert.ok(nodes(panel).includes(paragraphs))
  button.props.onClick()
  assert.equal(render().panel.props.style.maxHeight, 112)

  content.children = [
    { getBoundingClientRect: () => ({ top: 0, bottom: 84 }) },
    { getBoundingClientRect: () => ({ top: 96, bottom: 224 }) },
  ]
  resize()
  assert.equal(render().panel.props.style.maxHeight, 84)

  content.offsetHeight = 84
  content.children.pop()
  resize()
  assert.equal(render().button, undefined)
  cleanup()
  assert.equal(disconnected, true)
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

test('equivalent legacy search URLs keep their use and canonicalize to dedicated landings', async () => {
  const search = load('app/[locale]/(root)/search/page.tsx', {
    '@/components/shared/pagination': () => null,
    '@/components/shared/product/product-card': () => null,
    'next/navigation': { notFound() { throw new Error('NOT_FOUND') } },
    '@/lib/catalog-data': { getCatalogLandings: async () => ({
      brands: new Map([['mix-plus', { products: Array.from({ length: 21 }, () => ({ brand: 'میکس پلاس' })) }]]),
    }) },
    '@/lib/actions/product.actions': {
      async getAllProducts({ category, subCategory }) {
        const invalid = category === 'fake' || subCategory === 'fake'
        return { products: [], totalPages: invalid ? 0 : 3, totalProducts: invalid ? 0 : 21 }
      },
      async hasPublishedCategorySelection() { return false },
    },
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
  assert.equal(new URL(subcategory.alternates.canonical).pathname, '/subcategory/steel-cooktops')
  assert.equal(subcategory.robots.index, false)
  const searchMetadata = (searchParams) => search.generateMetadata({ searchParams: Promise.resolve(searchParams) })
  const plates = await searchMetadata({ category: 'فلاش تانک', subCategory: 'صفحه کلید فلاش تانک توکار' })
  assert.equal(new URL(plates.alternates.canonical).pathname, '/subcategory/flush-plates')
  assert.equal(plates.robots.index, false)
  const selection = { category: 'اجاق گاز', subCategory: 'اجاق گاز استیل' }
  const second = await searchMetadata({ ...selection, page: '2', utm_source: 'audit' })
  assert.equal(second.robots.index, false)
  assert.equal(new URL(second.alternates.canonical).searchParams.get('page'), '2')
  assert.equal(new URL(second.alternates.canonical).searchParams.get('utm_source'), null)
  const brand = await searchMetadata({ brand: 'میکس پلاس', page: '2', utm_source: 'audit' })
  assert.equal(brand.robots.index, false)
  assert.equal(brand.alternates.canonical, 'https://viora-store.ir/brand/mix-plus?page=2')
  assert.equal((await searchMetadata({ ...selection, q: 'x' })).robots.index, false)
  assert.equal((await searchMetadata({ ...selection, page: '2', brand: 'x' })).robots.index, false)
  for (const query of [{ category: 'fake' }, { ...selection, subCategory: 'fake' }, { ...selection, page: '99' }]) {
    await assert.rejects(searchMetadata(query), /NOT_FOUND/)
  }
})

test('pagination still renders real links for a valid second page', () => {
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
    ['چینی آلات بهداشتی', ['/category/toilet']],
    ['فلاش تانک', ['فلاش تانک روکار', 'فلاش تانک توکار'].map(
      (name) => '/search?category=' + encodeURIComponent('فلاش تانک') + '&subCategory=' + encodeURIComponent(name)
    )],
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
    assert.equal(tree.some(node => node.props?.href?.includes(
      encodeURIComponent('صفحه کلید فلاش تانک توکار')
    )), false)
  }
})

test('homepage category names navigate independently from exclusive disclosure buttons', () => {
  const state = []
  let cursor
  const Link = () => null
  const HomeCard = load('components/shared/home/home-card.tsx', {
    react: { ...React, useId: () => 'categories', useState(initial) {
      const index = cursor++
      if (!(index in state)) state[index] = initial
      return [state[index], (value) => { state[index] = value }]
    } },
    'next/link': Link,
  }).HomeCard
  const render = () => {
    cursor = 0
    return nodes(HomeCard())
  }
  const button = (tree, name) => tree.find((node) =>
    node.type === 'button' && node.props['aria-label'] === `زیرمجموعه‌های ${name}`)
  const link = (tree, path) => tree.find((node) => node.type === Link && node.props.href === path)
  const panel = (tree, control) => tree.find((node) => node.props?.id === control.props['aria-controls'])
  let tree = render()
  for (const path of ['/category/kitchen-equipment', '/category/sanitary-ware', '/category/faucets',
    '/category/tiles-and-ceramics', '/category/accessories', '/search?category=' + encodeURIComponent('کف شور')]) {
    assert.ok(link(tree, path), path)
  }
  button(tree, 'تجهیزات آشپزخانه').props.onClick()
  tree = render()
  for (const [name, destination] of [['سینک', '/category/sink'], ['اجاق گاز', '/category/cooktops']]) {
    const control = button(tree, name)
    assert.ok(control)
    const title = link(tree, destination)
    assert.ok(title)
    assert.equal(title.props.onClick, undefined)
    assert.ok(!nodes(control).some((node) => node.type === Link))
    assert.ok(!nodes(title).some((node) => node.type === 'button'))
  }
  assert.ok(link(tree, '/search?category=' + encodeURIComponent('هود')))
  assert.equal(button(tree, 'هود'), undefined)
  button(tree, 'سینک').props.onClick()
  tree = render()
  assert.equal(panel(tree, button(tree, 'سینک')).props.hidden, false)
  assert.equal(panel(tree, button(tree, 'اجاق گاز')).props.hidden, true)
  button(tree, 'اجاق گاز').props.onClick()
  tree = render()
  assert.equal(panel(tree, button(tree, 'سینک')).props.hidden, true)
  assert.equal(panel(tree, button(tree, 'اجاق گاز')).props.hidden, false)
  assert.ok(nodes(button(tree, 'اجاق گاز')).some((node) => node.props?.className?.includes('rotate-180')))
  button(tree, 'چینی‌آلات بهداشتی').props.onClick()
  tree = render()
  assert.equal(panel(tree, button(tree, 'تجهیزات آشپزخانه')).props.inert, true)
  assert.equal(panel(tree, button(tree, 'چینی‌آلات بهداشتی')).props.inert, false)
  assert.equal(panel(tree, button(tree, 'اجاق گاز')).props.hidden, true)
  assert.ok(link(tree, '/category/toilet'))
  assert.ok(link(tree, '/category/flush-tanks'))
  assert.equal(nodes(panel(tree, button(tree, 'چینی‌آلات بهداشتی')))
    .some((node) => node.props?.href === '/category/flush-tanks'), false)
  button(tree, 'فلاش تانک').props.onClick()
  tree = render()
  assert.equal(panel(tree, button(tree, 'چینی‌آلات بهداشتی')).props.inert, true)
  assert.equal(panel(tree, button(tree, 'فلاش تانک')).props.inert, false)
  assert.deepEqual(nodes(panel(tree, button(tree, 'فلاش تانک')))
    .filter((node) => node.type === Link)
    .map((node) => new URL(node.props.href, 'https://viora-store.ir').searchParams.get('subCategory')),
  ['فلاش تانک روکار', 'فلاش تانک توکار'])
  button(tree, 'چینی‌آلات بهداشتی').props.onClick()
  tree = render()
  button(tree, 'چینی‌آلات بهداشتی').props.onClick()
  tree = render()
  assert.equal(panel(tree, button(tree, 'چینی‌آلات بهداشتی')).props.inert, true)
})

test('sitemap reads direct edits and excludes operational timestamps', async () => {
  let products = [{ slug: 'before', category: 'سینک', subCategory: 'گرانیتی', updatedAt: new Date() }]
  const { default: sitemap } = load('app/sitemap.ts', {
    '@/lib/db': { connectToDatabase: async () => {} },
    '@/lib/db/models/product.model': {
      find() { return { select() { return this }, async lean() { return products } } },
    },
  })
  const first = await sitemap()
  assert.ok(first.some(({ url }) => url.endsWith('/product/before')))
  assert.ok(first.some(({ url }) => url.endsWith('/subcategory/granite-sinks')))
  assert.ok(!first.some(({ url }) => new URL(url).searchParams.get('subCategory') === 'گرانیتی'))
  assert.ok(first.every(item => item.lastModified === undefined))
  products = [{ ...products[0], slug: 'after' }]
  const updated = await sitemap()
  assert.ok(updated.some(({ url }) => url.endsWith('/product/after')))
  assert.ok(!updated.some(({ url }) => url.endsWith('/product/before')))
})

test('sign-in callback keeps the checkout destination and rejects self-redirects', () => {
  const { signInCallback } = load('lib/sign-in-callback.ts')
  assert.equal(signInCallback('/checkout/order?retry=1'), '/checkout/order?retry=1')
  for (const URL of ['/sign-in', '/fa/sign-up', '//other.example', 'https://viora-store.ir//other.example', 'https://other.example/']) {
    assert.equal(signInCallback(URL), '/')
  }
})

test('flush-tank filters retain concealed plates and isolate the other subcategories', () => {
  const {
    flushTankCategory: category,
    surfaceFlushTanks: surface,
    concealedFlushTanks: concealed,
  } = load('lib/flush-tank-catalog.ts')
  const plates = 'صفحه کلید فلاش تانک توکار'
  const { matchesCatalogSubcategory, catalogSubcategoryFilter } = load('lib/catalog-landings.ts')
  const products = [
    { category, subCategory: surface, name: 'فلاش تانک روکار ایمن آب' },
    { category, subCategory: concealed, name: 'مخزن توکار سارودی' },
    { category, subCategory: plates, name: 'آرال ۱۰۰ سارودی' },
    { category, subCategory: concealed, name: 'صفحه‌کلید ایمن آب' },
    { category: 'اکسسوری', name: 'صفحه کلید' },
  ]
  for (const [subCategory, expected] of [[surface, [0]], [concealed, [1, 2, 3]], [plates, [2, 3]]]) {
    const filter = catalogSubcategoryFilter(subCategory)
    const clauses = filter.$or ?? [filter]
    const matchesClause = (product, clause) => Object.entries(clause).every(
      ([field, value]) => typeof value === 'string' ? product[field] === value : value.test(product[field])
    )
    assert.deepEqual(products.flatMap((p, i) => matchesCatalogSubcategory(p, subCategory) ? [i] : []), expected)
    assert.deepEqual(products.flatMap((p, i) => clauses.some((clause) => matchesClause(p, clause)) ? [i] : []), expected)
  }
})
