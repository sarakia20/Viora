const assert = require('node:assert/strict')
const { once } = require('node:events')
const { createServer } = require('node:http')
const { test } = require('node:test')
const {
  buildImageIndex, checkImage, findRenderedProduct, localImage, productImageReferences,
} = require('../scripts/check-product-images.cjs')

const origin = 'https://viora-store.ir'

test('production probes literal paths and pre-release Mongo checks resolve verified aliases', () => {
  const raw = '/images/Alvand_corom.png'
  const product = { name: 'Alvand', slug: 'alvand', images: [raw], variants: [
    { color: '\u062f\u0631\u062c\u0647 \u06f1', image: raw },
    { color: 'Black', image: '' },
  ] }
  const references = productImageReferences(product)
  assert.deepEqual(references.map(({ role }) => role), ['main', 'grade'])
  const html = `<script>self.__next_f.push([1,${JSON.stringify(
    '0:' + JSON.stringify({ product: { _id: 'id', ...product } }),
  )}])</script>`
  assert.equal(findRenderedProduct(html, product.slug).variants[0].image, raw)
  const item = { ...product, references, schemaImages: [raw], ogImages: [raw] }
  assert.ok(buildImageIndex([item], origin, 'live').images.has(origin + raw))
  const staging = 'https://staging.example.test'
  assert.ok(buildImageIndex([{ ...item, schemaImages: [origin + raw] }], staging, 'live')
    .images.has(staging + raw))
  assert.ok(buildImageIndex([item], origin, 'mongo').images.has(origin + '/images/alvand-chrome-kitchen-faucet.webp'))
})

test('case and extension differences do not pass an exact file check', () => {
  const file = 'public/images/sub/ST-628.webp'
  const files = new Map([[file, { file, git: 'untracked' }]])
  const result = localImage(new URL('/images/sub/st-628.JPG', origin), origin, files)
  assert.equal(result.exact, null)
  assert.deepEqual(result.candidates, [{ file, git: 'untracked' }])
})

test('GET rejects an HTML response, a missing image, and redirects', async (t) => {
  const server = createServer((req, res) => {
    assert.equal(req.method, 'GET')
    if (req.url === '/real.webp') res.writeHead(200, { 'Content-Type': 'image/webp' }).end('image bytes')
    else if (req.url === '/redirect.webp') res.writeHead(302, { Location: '/real.webp' }).end()
    else res.writeHead(req.url === '/missing.webp' ? 404 : 200, { 'Content-Type': 'text/html' }).end('HTML')
  }).listen(0, '127.0.0.1')
  t.after(() => server.close())
  await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}`
  assert.equal((await checkImage(base + '/real.webp')).healthy, true)
  for (const [url, status] of [['/html.webp', 200], ['/missing.webp', 404], ['/redirect.webp', 302]]) {
    const result = await checkImage(base + url)
    assert.equal(result.status, status)
    assert.equal(result.healthy, false)
  }
})
