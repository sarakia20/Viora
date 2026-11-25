const { execFileSync } = require('node:child_process')
const { readdirSync, statSync } = require('node:fs')
const path = require('node:path')
const { resolveProductImage } = require('../lib/store-images.ts')

const root = path.resolve(__dirname, '..')
const production = 'https://viora-store.ir'
const imageRoot = 'public/images'

function gitFiles(...args) {
  return new Set(execFileSync('git', ['ls-files', '-z', ...args, '--', imageRoot], {
    cwd: root, encoding: 'utf8',
  }).split('\0').filter(Boolean))
}

function inventory() {
  const tracked = gitFiles('--cached')
  const untracked = gitFiles('--others', '--exclude-standard')
  const files = new Map()
  for (const entry of readdirSync(path.join(root, imageRoot), { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const absolute = path.join(entry.parentPath, entry.name)
    const file = path.relative(root, absolute).split(path.sep).join('/')
    files.set(file, { file, bytes: statSync(absolute).size,
      git: tracked.has(file) ? 'tracked' : untracked.has(file) ? 'untracked' : 'ignored' })
  }
  return files
}

async function mapLimited(items, operation) {
  let next = 0
  const results = []
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await operation(items[index])
    }
  }))
  return results
}

function get(url, redirect = 'error') {
  return fetch(url, { method: 'GET', redirect, signal: AbortSignal.timeout(20000) })
}

function decodeHtml(value) {
  return value.replace(/&(?:amp|quot|lt|gt|#39|#x27);/g, (entity) => ({
    '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>', '&#39;': "'", '&#x27;': "'",
  })[entity])
}

function productImageReferences(product) {
  return [
    ...(product.images ?? []).map((raw, index) => ({ raw, role: index === 0 ? 'main' : 'gallery' })),
    ...(product.variants ?? []).flatMap(({ image, color }) => image
      ? [{ raw: image, color, role: /\u062f\u0631\u062c\u0647/.test(color ?? '') ? 'grade' : 'variant' }] : []),
  ]
}

// Next serializes the public product for its client components in the HTML.
// This enrichment is optional because that payload format can change.
function findRenderedProduct(html, slug) {
  const flight = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)]
    .map((match) => JSON.parse(match[1])).join('')
  for (const match of flight.matchAll(/\{"_id":"[^"]+","name":"(?:[^"\\]|\\.)*","slug":"((?:[^"\\]|\\.)+)"/g)) {
    if (JSON.parse(`"${match[1]}"`) !== slug) continue
    let depth = 0
    const tokens = /"(?:[^"\\]|\\.)*"|[{}]/g
    tokens.lastIndex = match.index
    for (let token; (token = tokens.exec(flight));) {
      if (token[0] === '{') depth++
      if (token[0] === '}' && --depth === 0) {
        const product = JSON.parse(flight.slice(match.index, tokens.lastIndex))
        if (Array.isArray(product.images)) return product
        break
      }
    }
  }
}

async function readLive(origin) {
  const sitemap = await get(new URL('/sitemap.xml', origin))
  if (!sitemap.ok) throw new Error(`Sitemap HTTP ${sitemap.status}`)
  const urls = [...new Set([...((await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g))]
    .map((match) => new URL(decodeHtml(match[1])).pathname)
    .filter((pathname) => pathname.startsWith('/product/')))]
  if (!urls.length) throw new Error('No product URLs found in sitemap')
  return mapLimited(urls, async (pathname) => {
    try {
      const response = await get(new URL(pathname, origin))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const html = await response.text()
      const schema = [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)]
        .map((match) => JSON.parse(match[1])).find((item) =>
          item['@type'] === 'Product' || item['@type'] === 'ProductGroup')
      if (!schema) throw new Error('Product JSON-LD missing')
      const slug = decodeURIComponent(pathname.slice('/product/'.length))
      const rendered = findRenderedProduct(html, slug)
      const ogImages = [...html.matchAll(/<meta property="og:image" content="([^"]+)"/g)]
        .map((match) => decodeHtml(match[1]))
      return {
        slug, name: schema.name, brand: schema.brand?.name, rendered: Boolean(rendered),
        schemaImages: [schema.image, ...(schema.hasVariant ?? []).map((variant) => variant.image)]
          .flat().filter(Boolean), ogImages,
        references: rendered ? productImageReferences(rendered) : [],
      }
    } catch (error) {
      return { pathname, error: error.message }
    }
  })
}

async function readMongo() {
  const { MongoClient } = require('mongodb')
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required for --mongo')
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
  try {
    const products = await client.db(process.env.PRODUCT_IMAGE_DB).collection('products')
      .find({ isPublished: true }, { projection: {
        _id: 0, slug: 1, name: 1, brand: 1, images: 1, 'variants.image': 1, 'variants.color': 1,
      } }).toArray()
    return products.map(({ slug, name, brand, ...product }) => ({
      slug, name, brand, references: productImageReferences(product),
    }))
  } finally {
    await client.close()
  }
}

async function checkImage(url) {
  try {
    const response = await get(url, 'manual')
    const type = response.headers.get('content-type')
    const length = response.headers.get('content-length')
    // Verify that the server actually sends a body, without downloading the whole image.
    const reader = response.body?.getReader()
    let first
    if (reader) {
      try { first = await reader.read() } finally { await reader.cancel() }
    }
    return { status: response.status, type, bytes: length === null ? null : Number(length),
      location: response.headers.get('location'),
      healthy: response.status === 200 && Boolean(type?.startsWith('image/') && first?.value?.length) }
  } catch (error) {
    return { healthy: false, error: error.cause?.code ?? error.name }
  }
}

function buildImageIndex(products, origin, source) {
  const images = new Map()
  const invalidReferences = []
  for (const product of products.filter((item) => !item.error)) {
    const { slug, name, brand } = product
    const references = [
      ...product.references,
      ...(product.schemaImages ?? []).map((raw) => ({ raw, role: 'schema' })),
      ...(product.ogImages ?? []).map((raw, index) => ({ raw, role: index ? 'og' : 'og-main' })),
    ]
    if (!references.length || (source === 'live' && !product.schemaImages.length)) {
      invalidReferences.push({ slug, issue: 'No product image in catalog or Product JSON-LD' })
    }
    for (const { raw, role, color } of references) {
      const usage = { slug, name, brand, role, color, raw }
      try {
        if (typeof raw !== 'string' || !raw.trim()) throw new Error('Empty image path')
        // Probe the published URL verbatim. Only a pre-release Mongo check
        // should simulate path aliases from this checkout.
        const sourcePath = source === 'mongo' ? resolveProductImage(raw.trim()) : raw.trim()
        const url = new URL(sourcePath, origin)
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
          throw new Error('Invalid image URL')
        }
        const target = url.origin === production && origin !== production ? new URL(origin) : url
        target.pathname = url.pathname
        target.search = url.search
        decodeURIComponent(url.pathname)
        target.hash = ''
        if (url.pathname === '/images/product-placeholder.svg') {
          invalidReferences.push({ ...usage, issue: 'Placeholder used as a catalog image' })
        }
        if (!images.has(target.href)) images.set(target.href, [])
        images.get(target.href).push(usage)
      } catch {
        invalidReferences.push({ ...usage, issue: 'Invalid image path' })
      }
    }
  }
  return { images, invalidReferences }
}

function localImage(url, origin, files) {
  if (url.origin !== origin || !url.pathname.startsWith('/images/')) return null
  const file = 'public' + decodeURIComponent(url.pathname)
  const exact = files.get(file)
  const folded = file.toLowerCase()
  const stem = path.posix.basename(folded, path.posix.extname(folded))
  const candidates = exact ? [] : [...files.values()].filter(({ file: candidate }) => {
    const lower = candidate.toLowerCase()
    return lower === folded || path.posix.basename(lower, path.posix.extname(lower)) === stem
  })
  return { expected: file, exact: exact ?? null, candidates }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => !['--mongo', '--local-only'].includes(arg)) ||
      (args.includes('--local-only') && !args.includes('--mongo'))) {
    throw new Error('Usage: node scripts/check-product-images.cjs [--mongo [--local-only]]')
  }
  const origin = new URL(process.env.PRODUCT_IMAGE_ORIGIN ?? production).origin
  const localOnly = args.includes('--local-only')
  const files = inventory()
  const live = localOnly ? [] : await readLive(origin)
  const mongo = args.includes('--mongo') ? await readMongo() : null
  const liveIndex = buildImageIndex(live, origin, 'live')
  const mongoIndex = buildImageIndex(mongo ?? [], origin, 'mongo')
  const urls = [...new Set([...liveIndex.images.keys(), ...mongoIndex.images.keys()])].sort()
  const images = await mapLimited(urls, async (url) => ({
    url,
    local: localImage(new URL(url), origin, files),
    live: localOnly ? null : await checkImage(url),
    rendered: liveIndex.images.get(url) ?? [],
    mongo: mongoIndex.images.get(url) ?? [],
  }))
  const pageErrors = live.filter((item) => item.error)
  const invalidReferences = [...liveIndex.invalidReferences, ...mongoIndex.invalidReferences]
  const summary = {
    liveProducts: live.length - pageErrors.length, mongoProducts: mongo?.length ?? null,
    renderedProducts: live.filter((item) => item.rendered).length,
    checkedImages: images.length,
    healthyLiveImages: images.filter((item) => item.live?.healthy).length,
    unhealthyLiveImages: images.filter((item) => item.live && !item.live.healthy).length,
    missingLocalImages: images.filter((item) => item.local && !item.local.exact).length,
    untrackedLocalImages: images.filter((item) => item.local?.exact?.git === 'untracked').length,
  }
  console.log(JSON.stringify({ origin, summary, pageErrors, invalidReferences, images }, null, 2))
  if (pageErrors.length || invalidReferences.length || summary.unhealthyLiveImages ||
      (mongo && !mongo.length) || images.some((item) => item.local &&
        (item.mongo.length || localOnly) && item.local.exact?.git !== 'tracked')) process.exitCode = 1
}

if (require.main === module) {
  main().catch((error) => {
    // Mongo driver error messages can include connection details.
    console.error(error.name.startsWith('Mongo') ? `MongoDB read failed (${error.name})` : error.message)
    process.exitCode = 1
  })
}

module.exports = { buildImageIndex, checkImage, findRenderedProduct, localImage, productImageReferences }
