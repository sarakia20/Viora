import type { IProduct } from '@/lib/db/models/product.model'

export const DEFAULT_PRODUCT_VARIANT_INDEX = 0

export function getProductVariant(
  product: Pick<IProduct, 'variants'>,
  index = DEFAULT_PRODUCT_VARIANT_INDEX
) {
  return product.variants?.[index] ?? product.variants?.[DEFAULT_PRODUCT_VARIANT_INDEX]
}
