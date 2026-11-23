const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const load = require('./helpers/load-typescript.cjs')

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  return [tree, ...nodes(tree.props?.children)]
}

const product = {
  _id: 'product-id', name: 'محصول آزمایشی', slug: 'sample', category: 'شیرآلات',
  brand: 'ویورا', description: 'توضیح واقعی محصول\nجنس: استیل', images: ['/white.webp', '/black.webp'],
  sizes: ['S', 'L'], colors: ['سفید', 'مشکی'], tags: [],
  variants: [
    { color: 'سفید', image: '/white.webp', price: 1200, listPrice: 1500, countInStock: 4 },
    { color: 'مشکی', image: '/black.webp', price: 2400, listPrice: 3000, countInStock: 2 },
    { color: 'بامبو', image: '/bamboo.webp', price: 3600, countInStock: 0 },
  ],
}

test('variant selection keeps gallery, price, stock and exact cart model synchronized', () => {
  const state = []
  let cursor = 0
  const Gallery = () => null
  const Price = () => null
  const Cart = () => null
  const Details = load('components/shared/product/product-variant-details.tsx', {
    react: { ...React, useState(initial) {
      const index = cursor++
      if (!(index in state)) state[index] = initial
      return [state[index], value => { state[index] = value }]
    } },
    'next-intl': { useTranslations: () => () => 'stock' },
    '@/lib/utils': { generateId: () => 'cart-id', round2: value => value },
    '@/components/ui/card': { Card: 'div', CardContent: 'div' },
    '@/components/ui/separator': { Separator: 'hr' },
    './add-to-cart': Cart, './product-gallery': Gallery,
    './product-price': Price, './rating-summary': () => null,
    './color-swatch': load('components/shared/product/color-swatch.tsx'),
  }).default
  const render = () => { cursor = 0; return nodes(Details({ product, initialSize: 'S' })) }
  let tree = render()
  assert.equal(tree.filter(n => n.type === 'h1').length, 1)
  assert.deepEqual(tree.find(n => n.type === Gallery).props.images, ['/white.webp'])
  assert.equal(tree.find(n => n.type === Price).props.price, 1200)
  assert.equal(tree.find(n => n.type === Price).props.listPrice, 1500)
  tree.find(n => n.type === 'button' && n.props['aria-label'] === 'مشکی').props.onClick()
  tree = render()
  assert.deepEqual(tree.find(n => n.type === Gallery).props.images, ['/black.webp'])
  assert.equal(tree.find(n => n.type === Price).props.price, 2400)
  assert.equal(tree.find(n => n.type === Price).props.listPrice, 3000)
  assert.equal(tree.find(n => n.props?.['aria-live'] === 'polite' && n.type === 'span').props.children, 'مشکی')
  for (const button of tree.filter(n => n.type === 'button' && n.props['aria-label'])) {
    assert.match(button.props.className, /h-11 w-11/)
  }
  tree.find(n => n.type === 'button' && n.props.children === 'L').props.onClick()
  tree = render()
  const item = tree.find(n => n.type === Cart).props.item
  assert.equal(item.color, 'مشکی')
  assert.equal(item.size, 'L')
  assert.equal(item.price, 2400)
  assert.equal(item.image, '/black.webp')
  assert.equal(item.countInStock, 2)
  assert.equal(item.product, 'product-id')
  tree.find(n => n.type === 'button' && n.props['aria-label'] === 'بامبو').props.onClick()
  tree = render()
  assert.equal(tree.some(n => n.type === Cart), false)
  assert.deepEqual(tree.find(n => n.type === Gallery).props.images, ['/bamboo.webp'])
  product.variants[2].image = ''
  tree = render()
  assert.deepEqual(tree.find(n => n.type === Gallery).props.images, product.images)
  product.variants[2].image = '/bamboo.webp'
})

test('product cards show the same default grade offer as the detail page and add that grade', () => {
  const Cart = () => null
  const Price = load('components/shared/product/product-price.tsx', {
    'next-intl': { useLocale: () => 'en' },
    '@/hooks/use-setting-store': select => select({ setting: { availableCurrencies: [{ code: 'IRT' }], currency: 'IRT' } }),
  }).default
  const Card = load('components/shared/product/product-card.tsx', {
    'next/image': 'img', 'next/link': 'a',
    '@/components/ui/card': { Card: 'div', CardContent: 'div', CardFooter: 'div', CardHeader: 'div' },
    '@/lib/product-seo': { getProductPath: slug => '/product/' + slug },
    './rating': () => null, './image-hover': () => null,
    './add-to-cart': Cart, './product-price': Price,
  }).default
  const sample = { ...product, price: 9000, listPrice: 10000, countInStock: 0,
    variants: product.variants.map((variant, index) => ({ ...variant, color: 'درجه ' + (index + 1) })) }
  // Inspect the nested components before expanding ProductPrice and AddToCart.
  const components = nodes(Card({ product: sample })).flatMap(node =>
    ['ProductDetails', 'AddButton'].includes(node.type?.name) ? nodes(node.type()) : [])
  const displayed = components.find(node => node.type === Price)
  const added = components.find(node => node.type === Cart).props.item
  assert.equal(displayed.props.price, 1200)
  assert.equal(displayed.props.listPrice, 1500)
  assert.equal(added.price, 1200)
  assert.equal(added.color, 'درجه 1')
  assert.equal(added.countInStock, 4)
  const markup = renderToStaticMarkup(displayed)
  for (const value of ['1,200', '1,500', '20٪']) assert.ok(markup.includes(value))
})

test('gallery preserves zoom and does not show redundant thumbnails for one image', () => {
  const Zoom = () => null
  const Gallery = load('components/shared/product/product-gallery.tsx', {
    react: { ...React, useState: () => [0, () => {}] },
    'next/image': () => null,
    'react-medium-image-zoom': Zoom,
    'react-medium-image-zoom/dist/styles.css': {},
  }).default
  const tree = nodes(Gallery({ images: ['/black.webp'], productName: 'sample' }))
  assert.equal(tree.filter(n => n.type === 'button').length, 0)
  assert.ok(tree.some(n => n.type === Zoom))
  const multiple = nodes(Gallery({ images: ['/front.webp', '/back.webp'], productName: 'sample' }))
  assert.equal(multiple.filter(n => n.type === 'button').length, 2)
  assert.doesNotThrow(() => Gallery({ images: [], productName: 'sample' }))
})

test('color swatches never use photos and an unrecognized finish remains neutral', () => {
  const Swatch = load('components/shared/product/color-swatch.tsx').default
  for (const name of ['ماربل', 'طرح اختصاصی']) {
    const swatch = Swatch({ name, image: '/actual.webp' })
    assert.equal(swatch.type, 'span')
    assert.deepEqual(swatch.props.style, { backgroundColor: '#e2e8f0' })
    assert.equal(swatch.props.children, undefined)
  }
  assert.equal(Swatch({ name: 'مشکی' }).props.style.backgroundColor, '#171717')
})

test('catalog color aliases, button finishes and Caspian patterns show their recorded colors', () => {
  const { getSwatchColors } = load('components/shared/product/color-swatch.tsx')
  for (const [name, expected] of [
    ['طلایی_مات', ['#c9a227']],
    ['مشکی مات', ['#171717']],
    ['کروم_مات', ['#cbd5e1']],
    ['سفید_طلایی', ['#fff', '#d4af37']],
    ['سفید با کلید کروم', ['#fff', '#cbd5e1']],
    ['تیتانیوم کلید کروم', ['#4b5563', '#cbd5e1']],
    ['ماربل طوسی', ['#fff', '#9ca3af']],
    ['بامبو', ['#fff', '#cbd5e1']],
    ['خورشید', ['#fff', '#d4af37']],
  ]) assert.deepEqual(getSwatchColors(name), expected, name)
})

test('product highlights come from recorded specifications and render as a capped RTL list', () => {
  const Highlights = load('components/shared/product/product-highlights.tsx').default
  const render = description => renderToStaticMarkup(React.createElement(Highlights, { description }))
  const html = render('مشخصات فنی: • نوع نصب: روکار • ظرفیت مخزن: ۷ لیتر • ظرفیت مخزن: ۷ لیتر • حجم تخلیه: ۲ تا ۸ لیتر • سیستم تخلیه: دوزمانه • فلوتر دیافراگمی • جنس قطعات: ABS • ضمانت: ۵ سال • خدمات پس از فروش: ۱۰ سال')
  assert.match(html, /dir="rtl"/)
  assert.ok(html.includes('ویژگی‌های برجسته محصول'))
  assert.ok(html.includes('ظرفیت مخزن: ۷ لیتر'))
  assert.equal((html.match(/<li /g) || []).length, 7)
  assert.equal((html.match(/ظرفیت مخزن/g) || []).length, 1)
  assert.equal((render('دارای مخزن شفاف').match(/<li /g) || []).length, 1)
  assert.equal(render(''), '')
  assert.equal(render('<script>alert(1)</script>'), '')
  assert.equal(render('توضیحاتی برای این محصول ثبت نشده است.'), '')
  const dimensions = render('نوع : خروجی به دیوار,طول: ۷۱۰ میلی متر,عرض: ۳۷۷ میلی متر,خروجی به دیوار(آکس) : ۱۶۰ میلی متر')
  assert.equal((dimensions.match(/<li /g) || []).length, 4)
  assert.ok(dimensions.includes('عرض: ۳۷۷ میلی متر'))
  const sink = render('این سینک با ابعاد 104×50 سانتی‌متر طراحی شده و دارای لگن عمیق 25 سانتی‌متری است.')
  assert.ok(sink.includes('ابعاد 104×50 سانتی‌متر'))
  assert.ok(sink.includes('لگن عمیق 25 سانتی‌متری'))
})

test('product information is in server HTML, safely escaped, including products without variants', () => {
  const Information = load('components/shared/product/product-information.tsx', {
    './product-information.module.css': { default: {} },
  }).default
  const html = renderToStaticMarkup(React.createElement(Information, {
    product: { ...product, variants: [], description: 'متن واقعی\n<script>alert(1)</script>' },
  }))
  assert.ok(html.includes('متن واقعی'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('مشخصات فنی'))
  assert.ok(html.includes('هنوز پرسش و پاسخی'))
  assert.ok(html.includes('سفید، مشکی'))
  assert.equal((html.match(/<h2/g) || []).length, 3)
})


test('compound swatches split only fully recognized color names into actual named colors', () => {
  const { default: Swatch, getSwatchColors } = load('components/shared/product/color-swatch.tsx')
  const whiteGold = 'سفید طلایی'
  const blackChrome = 'مشکی کروم'
  assert.deepEqual(getSwatchColors(whiteGold), ['#fff', '#d4af37'])
  assert.deepEqual(getSwatchColors(blackChrome), ['#171717', '#cbd5e1'])
  assert.deepEqual(getSwatchColors('WHITE + GOLD'), ['#fff', '#d4af37'])
  assert.deepEqual(getSwatchColors('طلایی‌مات'), ['#c9a227'])
  assert.equal(getSwatchColors('black mystery'), undefined)
  assert.equal(getSwatchColors(''), undefined)
  const twoTone = Swatch({ name: whiteGold })
  assert.match(twoTone.props.style.background, /#fff 0% 50%, #d4af37 50% 100%/)
  for (const name of [whiteGold, blackChrome, 'black', 'unknown']) {
    const html = renderToStaticMarkup(React.createElement(Swatch, { name, image: '/never-used.webp' }))
    assert.ok(!html.includes('<img'))
    assert.ok(!html.includes('never-used.webp'))
    assert.match(html, /h-6 w-6/)
  }
})

const caspianColors = [
  ['سفید', ['#fff']],
  ['طلایی', ['#d4af37']],
  ['تیتانیوم', ['#4b5563']],
  ['اقیانوسی', ['#007a8a']],
  ['مرجانی', ['#ff7f50']],
  ['مشکی - کلید طلایی', ['#171717', '#d4af37']],
  ['مشکی - کلید کروم', ['#171717', '#cbd5e1']],
]

for (const [name, palette] of caspianColors) {
  test('Caspian Plus color renders an empty circle: ' + name, () => {
    const { default: Swatch, getSwatchColors } = load('components/shared/product/color-swatch.tsx')
    assert.deepEqual(getSwatchColors(name), palette)
    const circle = Swatch({ name })
    assert.equal(circle.props.children, undefined)
    if (palette.length === 1) assert.equal(circle.props.style.backgroundColor, palette[0])
    else assert.equal(circle.props.style.background,
      'linear-gradient(135deg, ' + palette[0] + ' 0% 50%, ' + palette[1] + ' 50% 100%)')
    const html = renderToStaticMarkup(React.createElement(Swatch, { name }))
    assert.match(html, /h-6 w-6/)
    assert.match(html, /rounded-full/)
    assert.match(html, /border-black/)
    assert.ok(!html.includes('?'))
    assert.ok(!html.includes('<img'))
    assert.ok(!html.includes(name))
  })
}

test('both selectors use a single scrolling row with no labels below color circles', () => {
  const swatches = load('components/shared/product/color-swatch.tsx')
  const state = []
  let cursor = 0
  const Gallery = () => null
  const Price = () => null
  const Cart = () => null
  const Details = load('components/shared/product/product-variant-details.tsx', {
    react: { ...React, useState(initial) {
      const index = cursor++
      if (!(index in state)) state[index] = initial
      return [state[index], value => { state[index] = value }]
    } },
    'next-intl': { useTranslations: () => () => 'stock' },
    '@/lib/utils': { generateId: () => 'id', round2: value => value },
    '@/components/ui/card': { Card: 'div', CardContent: 'div' },
    '@/components/ui/separator': { Separator: 'hr' },
    './add-to-cart': Cart, './product-gallery': Gallery,
    './product-price': Price, './rating-summary': () => null,
    './color-swatch': swatches,
  }).default
  const sample = { ...product, category: 'test', colors: caspianColors.map(([name]) => name), sizes: [],
    variants: caspianColors.map(([name], i) => ({ color: name, image: i === 6 ? '' : '/image-' + i + '.webp',
      price: 1000 + i, countInStock: 2, listPrice: 2000 })) }
  const render = () => { cursor = 0; return nodes(Details({ product: sample, initialSize: '' })) }
  let tree = render()
  const SelectVariant = load('components/shared/product/select-variant.tsx').default
  for (let i = 0; i < caspianColors.length; i++) {
    const name = caspianColors[i][0]
    tree.find(n => n.type === 'button' && n.props['aria-label'] === name).props.onClick()
    tree = render()
    const selected = tree.find(n => n.type === 'button' && n.props['aria-pressed'])
    assert.equal(selected.props['aria-label'], name)
    assert.equal(selected.props.title, name)
    assert.match(selected.props.className, /ring-2/)
    assert.equal(tree.find(n => n.type === 'span' && n.props['aria-live'] === 'polite').props.children, name)
    assert.deepEqual(tree.find(n => n.type === Gallery).props.images, i === 6 ? sample.images : ['/image-' + i + '.webp'])
    assert.equal(tree.find(n => n.type === Price).props.price, 1000 + i)
    assert.equal(tree.find(n => n.type === Cart).props.item.color, name)
  }
  const legacy = nodes(SelectVariant({ product: { ...sample, colors: [...sample.colors, 'unknown'] }, color: sample.colors[0], size: '' }))
  for (const all of [tree, legacy]) {
    const row = all.find(n => n.props?.className === swatches.colorOptionsClassName)
    assert.ok(row)
    assert.match(row.props.className, /flex-nowrap/)
    assert.match(row.props.className, /overflow-x-auto/)
    assert.match(row.props.className, /scroll-smooth/)
    assert.match(row.props.className, /gap-2/)
    assert.ok(!row.props.className.includes('flex-wrap '))
    const children = nodes(row)
    assert.ok(!children.some(n => n.type === 'span'), 'no visible text labels inside the row')
    assert.ok(!children.some(n => n.type === 'img'))
    const html = renderToStaticMarkup(row)
    assert.ok(!html.includes('>unknown<'))
    assert.ok(!html.includes('>?<'))
    for (const item of children.filter(n => n.type === 'button' || n.props?.asChild)) {
      assert.match(item.props.className, /h-11 w-11 shrink-0/)
    }
  }
})
