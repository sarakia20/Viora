'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { IProduct } from '@/lib/db/models/product.model'
import { generateId, round2 } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import AddToCart from './add-to-cart'
import ProductGallery from './product-gallery'
import ProductPrice from './product-price'
import RatingSummary from './rating-summary'
import ColorSwatch from './color-swatch'

export default function ProductVariantDetails({
  product,
  initialSize,
}: {
  product: IProduct
  initialSize: string
}) {
  const t = useTranslations()
  const variants = product.variants ?? []
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState(initialSize)
  const selectedVariant = variants[selectedVariantIndex] ?? variants[0]
  const variantLabel =
    variants.length > 0 &&
    (product.category === 'توالت ایرانی' ||
      product.category === 'توالت فرنگی')
      ? 'درجه کیفیت'
      : 'رنگ'

  if (!selectedVariant) return null

  const image = selectedVariant.image || product.images[0]
  const galleryImages = selectedVariant.image ? [selectedVariant.image] : product.images
  const isInStock = selectedVariant.countInStock > 0

  return (
    <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(260px,0.8fr)] lg:gap-8'>
      <div className='min-w-0'>
        <ProductGallery
          key={image}
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

        <div className='space-y-2'>
          <div className='text-sm text-slate-500'>{variantLabel}: <span className='font-semibold text-slate-900' aria-live='polite'>{selectedVariant.color}</span></div>
          <div className='flex flex-wrap gap-2'>
            {variants.map((variant, index) => (
              <button
                key={`${variant.color}-${index}`}
                type='button'
                onClick={() => setSelectedVariantIndex(index)}
                aria-pressed={selectedVariantIndex === index}
                aria-label={variant.color}
                title={variant.color}
                className={
                  selectedVariantIndex === index
                    ? 'flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 border-slate-800 bg-slate-50 p-1 ring-2 ring-slate-200 ring-offset-2 focus-visible:outline-slate-800'
                    : 'flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 border-slate-200 bg-white p-1 hover:border-slate-500 focus-visible:outline-slate-800'
                }
              >
                {variantLabel === 'درجه کیفیت' ? <span className='px-2 text-xs'>{variant.color}</span> : <ColorSwatch name={variant.color} image={variant.image} />}
              </button>
            ))}
          </div>
        </div>

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
              />
            </div>

            {selectedVariant.countInStock > 0 &&
              selectedVariant.countInStock <= 3 && (
                <div className='text-destructive font-bold'>
                  {t('Product.Only X left in stock - order soon', {
                    count: selectedVariant.countInStock,
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

            {isInStock && (
              <div className='flex justify-center items-center'>
                <AddToCart
                  key={`${selectedVariantIndex}-${selectedSize}`}
                  item={{
                    clientId: generateId(),
                    product: product._id.toString(),
                    countInStock: selectedVariant.countInStock,
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
