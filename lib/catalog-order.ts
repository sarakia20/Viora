export const catalogSort = 'catalog-order'

// Explicit priorities sort first. Products without a priority follow in ObjectId order.
export const catalogOrder = {
  catalogPriority: -1,
  _id: 1,
} as const
