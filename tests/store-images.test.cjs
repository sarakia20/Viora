const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const { getImageProps } = require('next/image')
const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const loadTypescript = require('./helpers/load-typescript.cjs')

const { resolveProductImage, isDirectGalleryImage, getProductImageRewrites } = loadTypescript('lib/store-images.ts')

test('verified extra-directory paths resolve to the exact model and finish', () => {
  const names = fs.readdirSync(path.join(__dirname, '../public/images'))
    .filter((name) => /^(flash-tank-imenab-persian|sarodi-alma)-.*\.webp$/.test(name))
  assert.equal(names.length, 9)
  assert.deepEqual(getProductImageRewrites().sort((a, b) => a.source.localeCompare(b.source)),
    names.sort().map((name) => ({ source: '/images/products/' + name, destination: '/images/' + name })))
  for (const name of names) {
    assert.equal(resolveProductImage('/images/products/' + name), '/images/' + name)
    assert.equal(isDirectGalleryImage('/images/' + name), false)
  }
  assert.equal(resolveProductImage('/images/products/bamboo-dual-black.webp'), '/images/products/bamboo-dual-black.webp')
  assert.equal(resolveProductImage('/images/bamboo-black.webp'), '/images/bamboo-black.webp')
})

test('legacy faucet variants resolve to the WebP for the same finish', () => {
  const cases = [
    ['Alvand_corom_mat.png', 'alvand-matte-chrome-kitchen-faucet.webp'],
    ['Alvand_talamat.png', 'Alvand_talamat.webp'],
    ['T_one_meshki.png', 't-one-black-kitchen-faucet.webp'],
    ['Eone_meshki_talai.png', 'e-one-black-gold-kitchen-faucet.webp'],
    ['anlo_talai_mat.png', 'anlo_talai_mat.webp'],
    ['harmoni_sefid_talai.png', 'harmoni_sefid_talai.webp'],
  ]

  for (const [legacy, webp] of cases) {
    const src = resolveProductImage('/images/' + legacy)
    assert.equal(src, '/images/' + webp)
    assert.ok(fs.existsSync(path.join(__dirname, '../public/images', webp)))
    const { props } = getImageProps({
      src, alt: webp, fill: true, priority: true, unoptimized: isDirectGalleryImage(src),
    })
    assert.equal(props.src, src)
    assert.equal(props.srcSet, undefined)
    assert.equal(props.loading, undefined)
  }
})

test('path resolution and the direct gallery allowlist leave other images alone', () => {
  const src = '/images/SG104.webp'
  assert.equal(resolveProductImage(src), src)
  assert.equal(isDirectGalleryImage(src), false)
  assert.equal(isDirectGalleryImage('/images/mix-plus-e6507.webp'), true)
  assert.equal(resolveProductImage('https://example.com/images/Alvand_corom.png'),
    'https://example.com/images/Alvand_corom.png')
  const { props } = getImageProps({ src, alt: 'Sink', fill: true })
  assert.match(props.src, /^\/_next\/image\?/)
  assert.equal(props.loading, 'lazy')
})

test('the gallery renders the exact selected finish directly and preloads the main image', () => {
  const { default: ProductGallery } = loadTypescript('components/shared/product/product-gallery.tsx', {
    'react-medium-image-zoom': ({ children }) => children,
    'react-medium-image-zoom/dist/styles.css': {},
  })
  const src = '/images/anlo_talai_mat.webp'
  const html = renderToStaticMarkup(createElement(ProductGallery, {
    images: ['/images/anlo_talai_mat.png'],
    productName: 'Anlo matte gold',
  }))
  assert.ok(html.includes(`rel="preload" as="image" href="${src}"`))
  assert.ok(html.includes(`src="${src}"`))
  assert.doesNotMatch(html, /\/\_next\/image|anlo_talai_mat\.png|loading="lazy"/)
})
