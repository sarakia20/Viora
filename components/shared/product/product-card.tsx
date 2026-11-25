import Link from 'next/link'
import React from 'react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { IProduct } from '@/lib/db/models/product.model'

import Rating from './rating'
import { generateId, round2 } from '@/lib/utils'
import ProductPrice from './product-price'
import ImageHover from './image-hover'
import AddToCart from './add-to-cart'
import { getProductPath } from '@/lib/product-seo'
import { getProductImageAlt, getProductVariant } from '@/lib/product-variant'
import { getProductStock, hasProductPrice, normalizeProduct } from '@/lib/product-display'
import { PRODUCT_IMAGE_PLACEHOLDER } from '@/lib/store-images'
import CatalogImage from './product-image'

const ProductCard = ({
  product: rawProduct,
  hideBorder = false,
  hideDetails = false,
  hideAddToCart = false,
  priorityImage = false,
}: {
  product: IProduct
  hideDetails?: boolean
  hideBorder?: boolean
  hideAddToCart?: boolean
  priorityImage?: boolean
}) => {
  const product = normalizeProduct(rawProduct)
  const variant = getProductVariant(product)
  const offer = variant ?? product
  const stock = getProductStock(product, variant)
  const canPurchase = stock > 0 && hasProductPrice(offer.price)
  const imageSizes = hideDetails
    ? '(max-width: 639px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 25vw, 17vw'
    : '(max-width: 639px) 82vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 20vw'

  const ProductImage = () => (
    <Link href={getProductPath(product.slug)}>
      <div className='relative h-40 sm:h-52'>
        {product.images.length > 1 ? (
          <ImageHover
            src={product.images[0]}
            hoverSrc={product.images[1]}
            alt={getProductImageAlt(product)}
            sizes={imageSizes}
            priority={priorityImage}
          />
        ) : (
          <div className='relative h-40 sm:h-52'>
            <CatalogImage
              src={product.images[0]}
              alt={getProductImageAlt(product)}
              fill
              sizes={imageSizes}
              priority={priorityImage}
              fetchPriority={priorityImage ? 'high' : undefined}
              className='object-contain'
            />
          </div>
        )}
        {hideDetails && stock === 0 && (
          <span className='absolute bottom-2 right-2 rounded-md bg-background/90 px-2 py-1 text-sm font-bold text-red-600 shadow-sm'>
            ناموجود
          </span>
        )}
      </div>
    </Link>
  )
  const ProductDetails = () => (
    <div className='flex-1 space-y-1'>
      
      <Link
  href={getProductPath(product.slug)}
  className=' overflow-hidden text-ellipsis text-sm leading-6'
  style={{
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  }}
>
  {product.name}
</Link>

<div className='mt-0 flex justify-end'>
  <Rating rating={product.avgRating} />
</div>


      {stock > 0 || !hasProductPrice(offer.price) ? (
        <ProductPrice
          isDeal={product.tags.includes('todays-deal')}
          price={offer.price}
          listPrice={offer.listPrice}
          discountPercent={variant?.discountPercent}
          forListing
        />
      ) : null}
      {stock === 0 && (
        <div className='flex min-h-[38px] w-full items-center justify-end'>
          <span className='font-bold text-red-600'>ناموجود</span>
        </div>
      )}
    </div>
  )
  const AddButton = () => (
    <div className='w-full text-center'>
      <AddToCart
        minimal
        item={{
          clientId: generateId(),
          product: product._id.toString(),
          size: product.sizes[0],
          color: variant ? variant.color : product.colors[0],
          countInStock: stock,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: round2(offer.price),
          quantity: 1,
          image: variant?.image || product.images[0] || PRODUCT_IMAGE_PLACEHOLDER,
        }}
      />
    </div>
  )

  return hideBorder ? (
    <div className='flex flex-col'>
      <ProductImage />
      {!hideDetails && (
        <>
          <div className='p-3 flex-1 text-center'>
            <ProductDetails />
          </div>
          {!hideAddToCart && canPurchase && <AddButton />}
        </>
      )}
    </div>
  ) : (
    <Card className='flex flex-col  '>
      <CardHeader className='p-3'>
        <ProductImage />
      </CardHeader>
      {!hideDetails && (
        <>
          <CardContent className='p-4 flex-1 text-right'>
            <ProductDetails />
          </CardContent>
          <CardFooter className='p-3'>
            {!hideAddToCart && canPurchase && <AddButton />}
          </CardFooter>
        </>
      )}
    </Card>
  )
}

export default ProductCard
