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
    './color-swatch': () => null,
  }).default
  const render = () => { cursor = 0; return nodes(Details({ product, initialSize: 'S' })) }
  let tree = render()
  assert.deepEqual(tree.find(n => n.type === Gallery).props.images, ['/white.webp'])
  tree.find(n => n.type === 'button' && n.props['aria-label'] === 'مشکی').props.onClick()
  tree = render()
  assert.deepEqual(tree.find(n => n.type === Gallery).props.images, ['/black.webp'])
  assert.equal(tree.find(n => n.type === Price).props.price, 2400)
  assert.equal(tree.find(n => n.type === Price).props.listPrice, 3000)
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
  assert.deepEqual(tree.find(n => n.type === Gallery).props.images, [])
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

test('decorative finishes use the real variant photo or their full name', () => {
  const Swatch = load('components/shared/product/color-swatch.tsx').default
  for (const name of ['بامبو', 'ماربل', 'خورشید']) {
    const photo = Swatch({ name, image: '/actual.webp' })
    assert.equal(photo.type, 'img')
    assert.equal(photo.props.src, '/actual.webp')
    assert.equal(Swatch({ name }).props.children, name)
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
