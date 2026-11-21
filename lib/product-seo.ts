import type { IProduct } from '@/lib/db/models/product.model'
import { getAbsoluteUrl } from '@/lib/site-url'
import { resolveProductImage } from '@/lib/store-images'

export function getProductPath(slug: string) {
  return `/product/${encodeURIComponent(slug)}`
}

export function getProductDescription(product: Pick<IProduct, 'name' | 'brand' | 'category' | 'description'>) {
  const description = product.description?.trim().replace(/\s+/g, ' ')
  if (description) return description
  return [product.name.trim(), product.brand?.trim(), product.category?.trim()]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join('؛ ')
}

export function getProductImageUrls(product: Pick<IProduct, 'images' | 'variants'>) {
  return [...new Set([
    product.variants?.[0]?.image,
    ...product.images,
    ...(product.variants ?? []).map((variant) => variant.image),
  ].flatMap((image) => {
    if (!image?.trim()) return []
    try {
      const url = new URL(getAbsoluteUrl(resolveProductImage(image.trim())))
      return ['https:', 'http:'].includes(url.protocol) ? [url.toString()] : []
    } catch { return [] }
  }))]
}

export function getProductJsonLd(product: IProduct) {
  if (!product.isPublished) return null
  const url = getAbsoluteUrl(getProductPath(product.slug))
  const makeOffer = (price: number, stock: number, name?: string) => {
    // Only advertise a price that exactly matches the whole-toman UI.
    // Do not round a database price to invent a different offer amount.
    const rialPrice = price * 10
    if (!Number.isSafeInteger(price) || price <= 0 || !Number.isSafeInteger(rialPrice) ||
      !Number.isInteger(stock) || stock < 0) return []
    return [{
      '@type': 'Offer',
      ...(name?.trim() ? { name: name.trim() } : {}),
      url,
      priceCurrency: 'IRR',
      price: rialPrice,
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    }]
  }
  const offers = product.variants?.length
    ? product.variants.flatMap((variant) => makeOffer(variant.price, variant.countInStock, variant.color))
    // This branch hides price when out of stock; don't advertise an invisible price.
    : product.countInStock > 0 ? makeOffer(product.price, product.countInStock) : []
  const images = getProductImageUrls(product)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    url,
    name: product.name.trim(),
    description: getProductDescription(product),
    ...(images.length ? { image: images } : {}),
    ...(product.brand?.trim() ? { brand: { '@type': 'Brand', name: product.brand.trim() } } : {}),
    ...(offers.length ? { offers } : {}),
    // Stored counters alone do not establish genuine, visible reviews.
  }
}
