import type { IProduct } from '@/lib/db/models/product.model'
import { getProductImageSource } from './store-images'

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : []
}

function finiteNumber(value: unknown): number | undefined {
  const number = typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value.trim())
    ? Number(value)
    : value
  return typeof number === 'number' && Number.isFinite(number) ? number : undefined
}

export function hasProductPrice(price: number) {
  return Number.isFinite(price) && price >= 0.5 && price <= Number.MAX_SAFE_INTEGER
}

function price(value: unknown) {
  const number = finiteNumber(value)
  return number !== undefined && hasProductPrice(number) ? number : 0
}

function stock(value: unknown) {
  const number = finiteNumber(value)
  return number !== undefined && Number.isSafeInteger(number) && number >= 0 ? number : undefined
}

function stockOf(value: Record<string, unknown>) {
  return stock(value.countInStock) ?? stock(value.stock) ?? 0
}

export function normalizeProduct<T extends object>(product: T) {
  const raw = record(product)
  const variants = (Array.isArray(raw.variants) ? raw.variants : []).flatMap((value) => {
    const variant = record(value)
    if (typeof variant.color !== 'string' || !variant.color.trim()) return []
    const discount = finiteNumber(variant.discountPercent)

    return [{
      color: variant.color,
      image: getProductImageSource(variant.image) ?? '',
      price: price(variant.price),
      listPrice: price(variant.listPrice),
      discountPercent: discount !== undefined && discount >= 0 && discount <= 100 ? discount : undefined,
      usesProductStock: variant.usesProductStock === true,
      countInStock: stockOf(variant),
    }]
  })
  const rating = finiteNumber(raw.avgRating)
  const numReviews = stock(raw.numReviews) ?? 0
  const hasUnusableVariants = raw.variants != null &&
    (!Array.isArray(raw.variants) || (raw.variants.length > 0 && variants.length === 0))

  return {
    ...product,
    images: strings(raw.images).flatMap((image) => getProductImageSource(image) ?? []),
    tags: strings(raw.tags),
    sizes: strings(raw.sizes),
    colors: strings(raw.colors),
    avgRating: rating !== undefined && rating >= 0 && rating <= 5 ? rating : 0,
    numReviews,
    ratingDistribution: (Array.isArray(raw.ratingDistribution) ? raw.ratingDistribution : []).flatMap((item) => {
      const entry = record(item)
      const rating = stock(entry.rating)
      const count = stock(entry.count)
      return rating !== undefined && rating >= 1 && rating <= 5 && count !== undefined && numReviews > 0
        ? [{ rating, count }]
        : []
    }),
    price: hasUnusableVariants ? 0 : price(raw.price),
    listPrice: price(raw.listPrice),
    countInStock: stockOf(raw),
    variants,
  }
}

export function getProductStock(product: Pick<IProduct, 'countInStock'>, variant?: NonNullable<IProduct['variants']>[number]) {
  return variant && !variant.usesProductStock ? variant.countInStock ?? 0 : product.countInStock
}
