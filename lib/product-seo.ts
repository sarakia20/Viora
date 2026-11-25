import type { IProduct } from '@/lib/db/models/product.model'
import { getAbsoluteUrl } from '@/lib/site-url'
import { getProductImageSource, PRODUCT_IMAGE_PLACEHOLDER } from '@/lib/store-images'
import { getProductStock } from '@/lib/product-display'
import { getVariantImage, getVariantSelection } from '@/lib/product-variant'

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

function publicImages(images: (string | undefined)[]) {
  return [...new Set(images.flatMap((image) => {
    const src = getProductImageSource(image)
    return src && src !== PRODUCT_IMAGE_PLACEHOLDER ? [getAbsoluteUrl(src)] : []
  }))]
}

export function getProductImageUrls(
  product: Pick<IProduct, 'images' | 'variants'> & Partial<Pick<IProduct, 'slug'>>,
  selectedIndex = 0
) {
  const variants = product.variants ?? []
  return publicImages([
    getVariantImage(product.slug, variants[selectedIndex]),
    ...product.images,
    ...variants.map((variant) => getVariantImage(product.slug, variant)),
  ])
}

function toRial(price: number | undefined) {
  if (typeof price !== 'number' || !Number.isSafeInteger(price) || price <= 0) return undefined
  const rial = price * 10
  return Number.isSafeInteger(rial) ? rial : undefined
}

function productOffer(url: string, price: number, listPrice: number | undefined, stock: number) {
  // Whole-toman prices let the visible amount, actual charge and IRR agree.
  const sale = toRial(price)
  if (sale === undefined || !Number.isSafeInteger(stock) || stock < 0) return undefined

  const regular = toRial(listPrice)
  return {
    '@type': 'Offer',
    url,
    priceCurrency: 'IRR',
    price: sale,
    availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    ...(regular !== undefined && regular > sale ? {
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceType: 'https://schema.org/StrikethroughPrice',
        priceCurrency: 'IRR',
        price: regular,
      },
    } : {}),
  }
}

export function getProductJsonLd(product: IProduct, selectedIndex = 0) {
  if (!product.isPublished) return null
  const url = getAbsoluteUrl(getProductPath(product.slug))
  const name = product.name.trim()
  const description = getProductDescription(product)
  const variants = product.variants ?? []
  const image = publicImages(product.images)
  const common = {
    '@context': 'https://schema.org',
    url, name, description,
    ...(image.length ? { image } : {}),
    ...(product.brand?.trim() ? { brand: { '@type': 'Brand', name: product.brand.trim() } } : {}),
    // Product counters alone do not establish genuine, published and visible reviews.
  }
  if (!variants.length) {
    const offer = productOffer(url, product.price, product.listPrice, getProductStock(product))
    return { ...common, '@type': 'Product', '@id': `${url}#product`, ...(offer ? { offers: [offer] } : {}) }
  }

  const groupId = `${url}#product-group`
  const seen = new Set<string>()
  const children = variants.flatMap((variant, index) => {
    const selection = getVariantSelection(variant)
    const variantUrl = new URL(url)
    variantUrl.searchParams.set(selection.key, selection.value)
    const href = variantUrl.toString()
    // The storefront and checkout both resolve the first record for a repeated selector.
    if (seen.has(href)) return []
    seen.add(href)
    const variantImage = getVariantImage(product.slug, variant)
    const images = publicImages([variantImage ?? (selection.key === 'grade' ? product.images[0] : undefined)])
    const offer = productOffer(href, variant.price, variant.listPrice, getProductStock(product, variant))
    return [{
      index,
      node: {
        '@type': 'Product',
        '@id': `${href}#product`,
        productID: href,
        url: href,
        name: `${name} - ${selection.label}`,
        isVariantOf: { '@id': groupId },
        ...(images.length ? { image: images } : {}),
        ...(selection.key === 'color' ? { color: selection.label } : {
          additionalProperty: {
            '@type': 'PropertyValue', name: 'درجه کیفیت', value: selection.label,
          },
        }),
        ...(offer ? { offers: [offer] } : {}),
      },
    }]
  })
  const selected = children.find((child) => child.index === selectedIndex)
  return {
    ...common,
    '@type': 'ProductGroup',
    '@id': groupId,
    productGroupID: product.slug,
    // Quality grade is not among Google's supported variation axes.
    ...(variants.every((variant) => getVariantSelection(variant).key === 'color')
      ? { variesBy: ['https://schema.org/color'] } : {}),
    hasVariant: [...(selected ? [selected] : []), ...children.filter((child) => child !== selected)]
      .map(({ node }) => node),
  }
}
