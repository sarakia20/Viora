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

test('color swatches never use photos and unrecognized finishes remain neutral', () => {
  const Swatch = load('components/shared/product/color-swatch.tsx').default
  for (const name of ['بامبو', 'ماربل', 'خورشید']) {
    const swatch = Swatch({ name, image: '/actual.webp' })
    assert.equal(swatch.type, 'span')
    assert.equal(swatch.props.style, undefined)
    assert.equal(swatch.props.children, '?')
  }
  assert.equal(Swatch({ name: 'مشکی' }).props.style.backgroundColor, '#171717')
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

test('unknown color labels stay visible in both selectors and use the same control sizing', () => {
  const { colorOptionClassName } = load('components/shared/product/color-swatch.tsx')
  const SelectVariant = load('components/shared/product/select-variant.tsx').default
  const tree = nodes(SelectVariant({ product, color: 'unknown', size: 'S' }))
  const button = tree.find(n => n.props?.asChild && n.props.className === colorOptionClassName(false))
  assert.ok(button)
  const unknownProduct = { ...product, colors: ['unknown'] }
  const unknownTree = nodes(SelectVariant({ product: unknownProduct, color: 'unknown', size: 'S' }))
  assert.ok(unknownTree.some(n => n.type === 'span' && n.props.children === 'unknown' && n.props.className.includes('text-center')))
  assert.ok(unknownTree.some(n => n.props?.className === colorOptionClassName(true)))
})
