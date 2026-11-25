'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { IProduct } from '@/lib/db/models/product.model'
import { generateId, round2 } from '@/lib/utils'
import { DEFAULT_PRODUCT_VARIANT_INDEX, getProductVariant } from '@/lib/product-variant'
import { getProductStock, hasProductPrice } from '@/lib/product-display'
import { PRODUCT_IMAGE_PLACEHOLDER } from '@/lib/store-images'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import AddToCart from './add-to-cart'
import ProductGallery from './product-gallery'
import ProductPrice from './product-price'
import RatingSummary from './rating-summary'
import ColorSwatch, { colorOptionClassName, colorOptionsClassName } from './color-swatch'

const gradeDigits = '۱۲۳123١٢٣'

function getGradeLabel(value: string) {
  const digit = /^درجه(?:[\s‌]+کیفیت)?[\s‌]*([۱۲۳123١٢٣])$/.exec(value?.trim() ?? '')?.[1]
  if (!digit) return ''

  const index = gradeDigits.indexOf(digit) % 3
  return `درجه ${gradeDigits[index]}`
}

export default function ProductVariantDetails({
  product,
  initialSize,
  highlights,
}: {
  product: IProduct
  initialSize: string
  highlights?: ReactNode
}) {
  const t = useTranslations()
  const variants = product.variants ?? []
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(DEFAULT_PRODUCT_VARIANT_INDEX)
  const [selectedSize, setSelectedSize] = useState(initialSize)
  const selectedVariant = getProductVariant(product, selectedVariantIndex)

  if (!selectedVariant) return null

  const gradeLabels = variants.map((variant) => getGradeLabel(variant.color))
  const hasQualityGrades = gradeLabels.every(Boolean)
  const selectedGrade = gradeLabels[selectedVariantIndex] ?? gradeLabels[0]
  const image = selectedVariant.image || product.images[0] || PRODUCT_IMAGE_PLACEHOLDER
  const galleryImage =
    product.slug === 'yaris60' && selectedVariant.image === '/images/yaris60.png'
      ? '/images/yaris60.webp'
      : selectedVariant.image
  const galleryImages = galleryImage ? [galleryImage] : product.images
  const stock = getProductStock(product, selectedVariant)
  const isInStock = stock > 0

  return (
    <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(260px,0.8fr)] lg:gap-8'>
      <div className='min-w-0'>
        <ProductGallery
          key={galleryImage || image}
          images={galleryImages}
          productName={`${product.name} - ${selectedVariant.color}`}
        />
      </div>

      <div className='flex min-w-0 w-full flex-col gap-6 lg:py-4'>
        <div className='flex flex-col gap-3'>
          <p className='w-fit rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600'>
            برند: {product.brand}
          </p>

          <h1 className='text-xl font-bold leading-relaxed text-slate-900 lg:text-2xl'>{product.name}</h1>

          <RatingSummary
            avgRating={product.avgRating}
            numReviews={product.numReviews}
            asPopover
            ratingDistribution={product.ratingDistribution}
          />

          <Separator />
        </div>

        {hasQualityGrades ? (
          <fieldset className='min-w-0'>
            <legend className='mb-2 text-sm font-semibold text-slate-900'>
              درجه کیفیت محصول: <span aria-live='polite'>{selectedGrade}</span>
            </legend>
            <div className='flex flex-wrap gap-2'>
              {gradeLabels.map((label, index) => {
                const isSelected = selectedVariantIndex === index

                return (
                  <button
                    key={`${label}-${index}`}
                    type='button'
                    onClick={() => setSelectedVariantIndex(index)}
                    aria-pressed={isSelected}
                    className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-sm font-medium text-slate-900 focus-visible:outline-slate-900 ${isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-500'}`}
                  >
                    {label}
                    <Check className={isSelected ? 'size-4' : 'invisible size-4'} aria-hidden='true' />
                  </button>
                )
              })}
            </div>
          </fieldset>
        ) : (
          <div className='space-y-2'>
            <div className='text-sm text-slate-500'>رنگ: <span className='font-semibold text-slate-900' aria-live='polite'>{selectedVariant.color}</span></div>
            <div className={colorOptionsClassName}>
              {variants.map((variant, index) => (
                <button
                  key={`${variant.color}-${index}`}
                  type='button'
                  onClick={() => setSelectedVariantIndex(index)}
                  aria-pressed={selectedVariantIndex === index}
                  aria-label={variant.color}
                  title={variant.color}
                  className={colorOptionClassName(selectedVariantIndex === index)}
                >
                  <ColorSwatch name={variant.color} />
                </button>
              ))}
            </div>
          </div>
        )}

        {product.sizes.length > 0 && (
          <div className='mt-2 space-y-2'>
            <div className='font-medium'>سایز:</div>
            <div className='flex flex-wrap gap-2'>
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type='button'
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={selectedSize === size}
                  className={
                    selectedSize === size
                      ? 'rounded-xl border-2 border-slate-900 bg-slate-50 px-4 py-2 text-sm font-medium'
                      : 'rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:border-slate-400'
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {highlights}
      </div>

      <div className='lg:sticky lg:top-40 lg:self-start'>
        <Card className='rounded-2xl border-slate-200 bg-slate-50/70 shadow-none'>
          <CardContent className='flex flex-col gap-5 p-5 sm:p-6'>
            <div className='text-sm text-slate-500'>قیمت فروش</div>
            <div aria-live='polite' aria-atomic='true'>
              <ProductPrice
                detail
                price={selectedVariant.price}
                listPrice={selectedVariant.listPrice}
                discountPercent={selectedVariant.discountPercent}
              />
            </div>

            {isInStock && stock <= 3 && (
                <div className='text-destructive font-bold'>
                  {t('Product.Only X left in stock - order soon', {
                    count: stock,
                  })}
                </div>
              )}

            <div
              className={
                isInStock
                  ? 'text-green-700 text-xl'
                  : 'text-destructive text-xl'
              }
            >
              {isInStock ? 'موجود' : 'ناموجود'}
            </div>

            {isInStock && hasProductPrice(selectedVariant.price) && (
              <div className='flex justify-center items-center'>
                <AddToCart
                  key={`${selectedVariantIndex}-${selectedSize}`}
                  item={{
                    clientId: generateId(),
                    product: product._id.toString(),
                    countInStock: stock,
                    name: product.name,
                    slug: product.slug,
                    category: product.category,
                    price: round2(selectedVariant.price),
                    quantity: 1,
                    image,
                    size: selectedSize,
                    color: selectedVariant.color,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
