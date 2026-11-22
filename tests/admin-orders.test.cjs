const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Types } = require('mongoose')
const load = require('./helpers/load-typescript.cjs')

function setup() {
  const ids = Array.from({ length: 3 }, () => new Types.ObjectId())
  const users = ids.map(_id => ({ _id, name: 'Sample', role: 'User', password: 'synthetic-secret' }))
  const orders = [0, 0, 2].map((index) => ({ user: ids[index] }))
  const queries = { aggregates: [], filters: [] }
  let isAdmin = true

  function paginated(rows) {
    let skip = 0
    return {
      select() { return this },
      sort() { return this },
      populate() { return this },
      skip(count) { skip = count; return this },
      limit(count) { return rows.slice(skip, skip + count) },
    }
  }

  const matching = (filter) => orders.filter(({ user }) => !filter.user || String(user) === filter.user)
  const mocks = {
    '@/auth': {},
    '@/emails': {},
    '../paypal': {},
    '../db': { connectToDatabase: async () => {} },
    '../auth-guard': { requireAdmin: async () => { if (!isAdmin) throw new Error('Forbidden') } },
    './setting.actions': { getSetting: async () => ({ common: { pageSize: 2 } }) },
    '../db/models/product.model': {},
    '../db/models/user.model': {
      find() {
        const query = paginated(users)
        const limit = query.limit
        query.limit = (count) => ({ lean: async () => limit(count) })
        return query
      },
      countDocuments: async () => users.length,
    },
    '../db/models/order.model': {
      aggregate: async (pipeline) => {
        queries.aggregates.push(pipeline)
        const userIds = pipeline[0].$match.user.$in
        return userIds.flatMap((_id) => {
          const total = matching({ user: String(_id) }).length
          return total ? [{ _id, total }] : []
        })
      },
      find(filter) { queries.filters.push(filter); return paginated(matching(filter)) },
      countDocuments: async (filter) => {
        queries.filters.push(filter)
        return matching(filter).length
      },
    },
  }
  return {
    ...load('lib/actions/user.actions.ts', mocks),
    ...load('lib/actions/order.actions.ts', mocks),
    ids,
    queries,
    revokeAdmin() { isAdmin = false },
  }
}

test('user list counts current-page orders with one aggregation and omits password', async () => {
  const { getAllUsers, ids, queries } = setup()
  const result = await getAllUsers({ page: 1 })
  assert.deepEqual(result.data.map(user => user.orderCount), [2, 0])
  assert.deepEqual(queries.aggregates, [[
    { $match: { user: { $in: ids.slice(0, 2) } } },
    { $group: { _id: '$user', total: { $sum: 1 } } },
  ]])
  assert.ok(result.data.every(user => !Object.hasOwn(user, 'password')))
  await getAllUsers({ page: 9 })
  assert.equal(queries.aggregates.length, 1)
})

test('order listing and pagination use the same user filter and reject malformed filters', async () => {
  const { getAllOrders, ids, queries } = setup()
  const userId = String(ids[0])
  const result = await getAllOrders({ page: 2, limit: 1, userId })
  assert.equal(result.totalPages, 2)
  assert.deepEqual(result.data.map(order => order.user), [userId])
  assert.deepEqual(queries.filters, [{ user: userId }, { user: userId }])
  for (const invalid of ['', 'bad', [userId, String(ids[1])], { $ne: null }]) {
    assert.deepEqual(await getAllOrders({ page: 1, userId: invalid }), { data: [], totalPages: 0 })
  }
  assert.equal(queries.filters.length, 2)
})

test('admin authorization runs before either listing can query orders', async () => {
  const { getAllOrders, getAllUsers, queries, revokeAdmin } = setup()
  revokeAdmin()
  await assert.rejects(getAllUsers({ page: 1 }), /Forbidden/)
  await assert.rejects(getAllOrders({ page: 1 }), /Forbidden/)
  assert.deepEqual(queries, { aggregates: [], filters: [] })
})

test('admin shipping uses order values and confirms successful copies', async () => {
  let feedback
  let clipboard
  const { default: ShippingDetails } = load('app/[locale]/admin/orders/[id]/shipping-details.tsx', {
    react: { useState: () => [feedback, (value) => { feedback = value }], useEffect() {} },
    '@/components/ui/button': { Button: 'button' },
  }, { navigator: { clipboard: { writeText: async (text) => { clipboard = text } } } })

  const address = { phone: '09000000000', country: 'A', province: 'B', city: 'C', street: 'D ٢1', postalCode: '0000000000' }
  function elements(node) {
    if (Array.isArray(node)) return node.flatMap(elements)
    if (!node?.props) return []
    return [node, ...elements(node.props.children)]
  }
  const display = elements(ShippingDetails({ address })).filter(node => node.type === 'bdi')
  assert.ok(display.some(node => node.props.dir === 'ltr' && node.props.children === '۰۹۰۰۰۰۰۰۰۰۰'))
  assert.ok(display.some(node => node.props.dir === 'ltr' && node.props.children === '۰۰۰۰۰۰۰۰۰۰'))
  assert.ok(display.some(node => node.props.children === 'D ۲۱'))
  for (const [label, expected] of [
    ['موبایل', address.phone],
    ['نشانی کامل', 'A، B، C، D ٢1'],
    ['کد پستی', address.postalCode],
  ]) {
    const button = elements(ShippingDetails({ address })).find(node => node.props['aria-label'] === `کپی ${label}`)
    await button.props.onClick()
    assert.equal(clipboard, expected)
    assert.deepEqual(feedback, { label, message: 'کپی شد' })
  }
  const empty = elements(ShippingDetails({}))
  assert.equal(empty.filter(node => node.props.children === 'ثبت نشده').length, 7)
  assert.ok(empty.every(node => node.type !== 'button'))
})
