const { test } = require('node:test')
const assert = require('node:assert/strict')
const load = require('./helpers/load-typescript.cjs')
const { buildCatalogLandings, getExactCollection, getProductCollection, getBrandSlug } =
  load('lib/catalog-landings.ts', {}, { URLSearchParams })

const product = (slug, brand, category, name, subCategory) => ({ slug, brand, category, name, subCategory })

test('catalog uses recorded brands and exact or explicitly named collections', () => {
  const list = [
    product('a', 'میکس پلاس', 'سینک', 'سینک مدل الف', 'گرانیتی'),
    product('b', 'Mix-Plus', 'سینک', 'سینک دو لگنه', 'گرانیتی'),
    product('c', 'الوند', 'شیرآلات', 'شیر ظرفشویی شاوری', 'شیر آشپزخانه'),
    product('d', 'مروارید', 'توالت فرنگی', 'توالت یک تکه', 'توالت فرنگی یک تکه'),
  ]
  const result = buildCatalogLandings(list)
  assert.equal(result.brands.get('mix-plus').label, 'میکس پلاس')
  assert.equal(result.brands.get('mix-plus').products.length, 2)
  assert.ok(!result.brands.has('ghahraman'))
  assert.equal(getBrandSlug(''), undefined)
  assert.equal(getProductCollection(list[2]).slug, 'kitchen-faucets')
  assert.equal(getExactCollection('سینک', 'گرانیتی').slug, 'granite-sinks')
  assert.deepEqual(result.subcategories.get('double-bowl-sinks').products.map(item => item.slug), ['b'])
  assert.equal(result.subcategories.get('one-piece-toilets').products[0].slug, 'd')
})

test('selected combinations require enough inventory and distinct parent assortments', () => {
  const items = Array.from({ length: 4 }, (_, index) =>
    product('plate-' + index, 'ایمن آب', 'فلاش تانک', 'صفحه کلید فلاش تانک'))
  const other = [
    product('other-a', 'سارودی', 'فلاش تانک', 'صفحه کلید الف'),
    product('other-b', 'سارودی', 'فلاش تانک', 'صفحه کلید ب'),
    product('tank', 'ایمن آب', 'فلاش تانک', 'مخزن'),
    product('soap', 'ایمن آب', 'اکسسوری', 'جامایع'),
  ]
  assert.equal(buildCatalogLandings(items).selected.length, 0)
  assert.equal(buildCatalogLandings([...items.slice(0, 3), ...other]).selected.length, 0)
  const index = buildCatalogLandings([...items, ...other])
  assert.equal(index.selected.length, 1)
  assert.equal(index.selected[0].configuration.collection, 'flush-plates')
  assert.deepEqual(index.selected[0].products.map(item => item.slug), items.map(item => item.slug))
})
