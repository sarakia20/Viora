import type { IProduct } from '@/lib/db/models/product.model'
import { getProductImageSource } from './store-images'

export const DEFAULT_PRODUCT_VARIANT_INDEX = 0
type Variant = NonNullable<IProduct['variants']>[number]

const gradeDigits = '۱۲۳123١٢٣'

export function getQualityGrade(value: string | undefined) {
  const digit = /^درجه(?:[\s‌]+کیفیت)?[\s‌]*([۱۲۳123١٢٣])$/.exec(value?.trim() ?? '')?.[1]
  return digit ? gradeDigits.indexOf(digit) % 3 + 1 : undefined
}

export function getVariantSelection(variant: Variant) {
  const grade = getQualityGrade(variant.color)
  return grade
    ? { key: 'grade', value: String(grade), label: `درجه ${gradeDigits[grade - 1]}` } as const
    : { key: 'color', value: variant.color, label: variant.color.trim() } as const
}

export function getRequestedVariantIndex(
  product: Pick<IProduct, 'variants'>,
  { color, grade }: { color?: string | string[]; grade?: string | string[] }
) {
  if ((color === undefined) === (grade === undefined)) return undefined
  const key = grade === undefined ? 'color' : 'grade'
  const query = grade ?? color
  if (typeof query !== 'string') return undefined
  const digit = query.trim()
  const value = key === 'grade' && digit.length === 1 && gradeDigits.includes(digit)
    ? String(gradeDigits.indexOf(digit) % 3 + 1)
    : query
  const index = product.variants?.findIndex((variant) => {
    const selection = getVariantSelection(variant)
    return selection.key === key && selection.value === value
  }) ?? -1
  return index < 0 ? undefined : index
}

export function getVariantImage(slug: string | undefined, variant?: Variant) {
  // Preserve the existing gallery mapping for this exact model.
  if (slug === 'yaris60' && variant?.image === '/images/yaris60.png') return '/images/yaris60.webp'
  return getProductImageSource(variant?.image)
}

export function getProductImageAlt(product: Pick<IProduct, 'name' | 'brand'>, variant?: Variant) {
  const name = product.name.trim()
  const brand = product.brand?.trim()
  return [
    name,
    brand && !name.toLocaleLowerCase('fa').includes(brand.toLocaleLowerCase('fa')) ? brand : undefined,
    variant ? getVariantSelection(variant).label : undefined,
  ].filter(Boolean).join(' - ')
}

export function getProductVariant(
  product: Pick<IProduct, 'variants'>,
  index = DEFAULT_PRODUCT_VARIANT_INDEX
) {
  return product.variants?.[index] ?? product.variants?.[DEFAULT_PRODUCT_VARIANT_INDEX]
}
