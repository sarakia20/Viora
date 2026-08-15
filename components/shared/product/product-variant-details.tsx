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

  if (!selectedVariant) return null

  const image = selectedVariant.image || product.images[0]
  const galleryImages = [
    image,
    ...product.images.filter((productImage) => productImage !== image),
  ]
  const isInStock = selectedVariant.countInStock > 0

  return (
    <div className='grid grid-cols-1 gap-5 md:grid-cols-5 md:gap-0'>
      <div className='min-w-0 md:col-span-2'>
        <ProductGallery key={image} images={galleryImages} />
      </div>

      <div className='flex min-w-0 w-full flex-col gap-2 md:col-span-2 md:p-5'>
        <div className='flex flex-col gap-3'>
          <p className='p-medium-16 rounded-full bg-grey-500/10 text-grey-500'>
            برند: {product.brand}
          </p>

          <h1 className='font-bold text-lg lg:text-xl'>{product.name}</h1>

          <RatingSummary
            avgRating={product.avgRating}
            numReviews={product.numReviews}
            asPopover
            ratingDistribution={product.ratingDistribution}
          />

          <Separator />

          {isInStock && (
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <div className='flex gap-3'>
                <ProductPrice
                  price={selectedVariant.price}
                  listPrice={selectedVariant.listPrice}
                  isDeal={product.tags.includes('todays-deal')}
                  forListing={false}
                />
              </div>
            </div>
          )}
        </div>

        <div className='space-y-2'>
          <div className='font-medium'>رنگ:</div>
          <div className='flex flex-wrap gap-2'>
            {variants.map((variant, index) => (
              <button
                key={`${variant.color}-${index}`}
                type='button'
                onClick={() => setSelectedVariantIndex(index)}
                aria-pressed={selectedVariantIndex === index}
                className={
                  selectedVariantIndex === index
                    ? 'rounded-xl border-2 border-slate-900 bg-slate-50 px-4 py-2 text-sm font-medium ring-1 ring-slate-900/10'
                    : 'rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:border-slate-400'
                }
              >
                {variant.color}
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

        <Separator className='my-2' />

        <div className='flex flex-col gap-2'>
          <p className='p-bold-20 text-grey-600'>توضیحات:</p>
          <p className='p-medium-16 lg:p-regular-18 leading-8 whitespace-pre-line'>
            {product.description}
          </p>
        </div>
      </div>

      <div className='md:sticky md:top-40 md:self-start'>
        <Card>
          <CardContent className='p-4 flex flex-col gap-4'>
            {isInStock && (
              <ProductPrice
                price={selectedVariant.price}
                listPrice={selectedVariant.listPrice}
              />
            )}

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
