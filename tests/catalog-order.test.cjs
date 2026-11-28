const assert = require('node:assert/strict')
const { test } = require('node:test')
const mongoose = require('mongoose')
const load = require('./helpers/load-typescript.cjs')

const port = process.env.CATALOG_TEST_MONGO_PORT

test('changing the search sort resets the page', () => {
  const { getFilterUrl } = load('lib/utils.ts', {}, { URLSearchParams })
  const url = new URL(getFilterUrl({ params: { page: '4' }, sort: 'price-low-to-high' }), 'https://test.local')
  assert.equal(url.searchParams.get('page'), '1')
  assert.equal(url.searchParams.get('sort'), 'price-low-to-high')
})

test('catalog order, optional priorities, and indexed pagination against an isolated MongoDB', { skip: !port }, async () => {
  assert.match(port, /^\d{1,5}$/)
  const database = `viora_catalog_test_${process.pid}_${Date.now()}`
  const uri = `mongodb://127.0.0.1:${port}/${database}`
  const { catalogOrder, catalogSort } = load('lib/catalog-order.ts')
  const cache = new Map()
  const mocks = {
    '@/lib/data': { products: [] },
    '@/lib/db': { connectToDatabase: async () => {} },
    'next/cache': { revalidatePath() {} },
    '../auth-guard': { requireAdmin: async () => {} },
    './setting.actions': { getSetting: async () => ({ common: { pageSize: 2 } }) },
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
  try {
    const Product = load('lib/db/models/product.model.ts', mocks, {}, cache).default
    await Product.init()
    const actions = load('lib/actions/product.actions.ts', mocks, {}, cache)
    const product = (slug, numSales, subCategory = 'sample-sub') => ({
      slug, name: slug, numSales, category: 'sample-category', subCategory,
      brand: 'sample', description: 'sample product', isPublished: true,
      price: 100, listPrice: 200, countInStock: 5, images: ['/sample.webp'],
      avgRating: 0, numReviews: 0, ratingDistribution: [],
    })
    const first = product('first', 20)
    const { insertedIds: { 0: firstId } } = await Product.collection.insertMany([
      first, { ...product('second', 20), catalogBaseline: { rank: 99, batch: 'legacy' } },
      product('third', 1, 'other-sub'),
    ])
    const list = async (params = {}) => {
      const result = await actions.getAllProducts({
        query: 'all', category: 'sample-category', tag: 'all', page: 1, limit: 9,
        sort: catalogSort, ...params,
      })
      return result.products.map(({ slug }) => slug)
    }
    const original = ['first', 'second', 'third']
    assert.deepEqual(await list({ sort: 'best-selling' }), ['second', 'first', 'third'])
    assert.deepEqual(await list(), original)
    assert.deepEqual(await list({ subCategory: 'sample-sub' }), original.slice(0, 2))

    const category = { isPublished: true, category: 'sample-category' }
    for (const [filter, index] of [
      [category, 'catalog_category_id_order'],
      [{ ...category, subCategory: 'sample-sub' }, 'catalog_subcategory_id_order'],
    ]) {
      const { queryPlanner } = await Product.find(filter).sort(catalogOrder).limit(2).hint(index).explain('queryPlanner')
      function checkPlan(plan) {
        assert.notEqual(plan.stage, 'SORT')
        if (plan.stage === 'IXSCAN') assert.equal(plan.indexName, index)
        if (plan.inputStage) checkPlan(plan.inputStage)
      }
      checkPlan(queryPlanner.winningPlan)
    }

    assert.equal((await actions.createProduct({ ...product('new-product', 50), avgRating: 5, price: 50 })).success, true)
    assert.equal((await actions.updateProduct({
      ...first, _id: firstId.toString(), numSales: 100, price: 500,
      countInStock: 0, description: 'edited', images: ['/edited.webp'],
    })).success, true)
    const { insertedId: compassId } = await Product.collection.insertOne(product('compass-import', 999))
    const imported = await Product.collection.findOne({ _id: compassId })
    for (const field of ['sortOrder', 'createdAt', 'catalogBaseline', 'catalogPriority']) {
      assert.equal(Object.hasOwn(imported, field), false)
    }
    const appended = [...original, 'new-product', 'compass-import']
    assert.deepEqual(await list(), appended)
    await Product.collection.updateOne({ _id: compassId }, { $set: {
      price: 200, countInStock: 0, images: ['/compass-edited.webp'], description: 'Compass edit',
    } })
    await Product.collection.updateOne({ _id: firstId }, { $set: { numSales: 101, countInStock: 2 } })
    assert.deepEqual(await list(), appended)
    assert.deepEqual(await list({ limit: 2 }), appended.slice(0, 2))
    assert.deepEqual(await list({ limit: 2, page: 2 }), appended.slice(2, 4))
    assert.deepEqual(await list({ limit: 2, page: 3 }), appended.slice(4))
    assert.deepEqual(await list({ limit: 2, page: 4 }), [])
    assert.deepEqual(await list({ subCategory: 'sample-sub' }), ['first', 'second', 'new-product', 'compass-import'])
    assert.equal((await list({ sort: 'best-selling' }))[0], 'compass-import')
    assert.equal((await list({ sort: 'price-high-to-low' }))[0], 'first')
    for (const sort of ['price-low-to-high', 'newest-arrivals', 'avg-customer-review']) {
      assert.equal((await list({ sort }))[0], 'new-product')
    }

    const newest = await Product.findOne({ slug: 'new-product' }).lean()
    assert.equal((await actions.updateProduct({ ...newest, _id: newest._id.toString(), sortOrder: -1 })).success, true)
    assert.deepEqual(await list(), ['new-product', ...original, 'compass-import'])
    assert.equal((await actions.updateProduct({ ...newest, _id: newest._id.toString(), price: 90 })).success, true)
    assert.equal((await Product.findById(newest._id)).sortOrder, -1)
    assert.deepEqual(await list(), ['new-product', ...original, 'compass-import'])
    assert.equal((await actions.updateProduct({ ...newest, _id: newest._id.toString(), sortOrder: null })).success, true)
    assert.deepEqual(await list(), appended)
    assert.equal(await Product.countDocuments({ sortOrder: { $exists: true } }), 0)

    assert.equal(await Product.countDocuments({ catalogPriority: { $exists: true } }), 0)
    assert.equal((await Product.findOne({ slug: 'first' })).numSales, 101)
  } finally {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
})
