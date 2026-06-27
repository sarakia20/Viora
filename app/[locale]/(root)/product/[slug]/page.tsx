import { auth } from '@/auth'
import AddToCart from '@/components/shared/product/add-to-cart'
import { Card, CardContent } from '@/components/ui/card'
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from '@/lib/actions/product.actions'

import ReviewList from './review-list'
import { generateId, round2 } from '@/lib/utils'
import SelectVariant from '@/components/shared/product/select-variant'
import ProductPrice from '@/components/shared/product/product-price'
import ProductGallery from '@/components/shared/product/product-gallery'
import AddToBrowsingHistory from '@/components/shared/product/add-to-browsing-history'
import { Separator } from '@/components/ui/separator'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import RatingSummary from '@/components/shared/product/rating-summary'
import ProductSlider from '@/components/shared/product/product-slider'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const t = await getTranslations()
  const params = await props.params
  const product = await getProductBySlug(params.slug)

  if (!product) {
    return { title: t('Product.Product not found') }
  }

  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductDetails(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page: string; color: string; size: string }>
}) {
  const searchParams = await props.searchParams
  const { page, color, size } = searchParams

  const params = await props.params
  const { slug } = params

  const session = await auth()
  const product = await getProductBySlug(slug)

  const relatedProducts = await getRelatedProductsByCategory({
    category: product.category,
    productId: product._id,
    page: Number(page || '1'),
  })

  const t = await getTranslations()

  return (
    <div>
      <AddToBrowsingHistory id={product._id} category={product.category} />

      <section>
        <div className='grid grid-cols-1 md:grid-cols-5'>
          <div className='col-span-2'>
            <ProductGallery images={product.images} />
          </div>

          <div className='flex w-full flex-col gap-2 md:p-5 col-span-2'>
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

              <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                <div className='flex gap-3'>
                  <ProductPrice
                    price={product.price}
                    listPrice={product.listPrice}
                    isDeal={product.tags.includes('todays-deal')}
                    forListing={false}
                  />
                </div>
              </div>
            </div>

            <div>
              <SelectVariant
                product={product}
                size={size || product.sizes[0]}
                color={color || product.colors[0]}
              />
            </div>

            <Separator className='my-2' />

            <div className='flex flex-col gap-2'>
              <p className='p-bold-20 text-grey-600'>توضیحات:</p>
              <p className='p-medium-16 lg:p-regular-18 leading-8 whitespace-pre-line'>
  {product.description}
</p>
            </div>
          </div>

          <div>
            <Card>
              <CardContent className='p-4 flex flex-col gap-4'>
                <ProductPrice price={product.price} />

                {product.countInStock > 0 && product.countInStock <= 3 && (
                  <div className='text-destructive font-bold'>
                    {t('Product.Only X left in stock - order soon', {
                      count: product.countInStock,
                    })}
                  </div>
                )}

                {product.countInStock !== 0 ? (
                  <div className='text-green-700 text-xl'>
                    {t('Product.In Stock')}
                  </div>
                ) : (
                  <div className='text-destructive text-xl'>
                    {t('Product.Out of Stock')}
                  </div>
                )}

                <div className='flex justify-center items-center'>
  <AddToCart
    item={{
      clientId: generateId(),
      product: product._id,
      countInStock: product.countInStock,
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: round2(product.price),
      quantity: 1,
      image: product.images[0],
      size: size || product.sizes[0],
      color: color || product.colors[0],
    }}
  />
</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className='mt-16'>
        <ProductSlider
          products={relatedProducts.data}
          title='محصولات مشابه'
        />
      </section>

      <section className='mt-12'>
        <ProductSlider
          products={relatedProducts.data}
          title='پرفروش‌ترین‌ها'
        />
      </section>

      <section className='mt-12'>
        <BrowsingHistoryList />
      </section>

      <section className='mt-16 pb-12' id='reviews'>
  <div className='rounded-2xl border border-slate-200 bg-white p-6 md:p-8'>
    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
      <div className='space-y-2'>
        <h2 className='text-2xl font-bold text-slate-900'>نظرات کاربران</h2>
        <p className='text-slate-600'>
          هنوز نظری برای این محصول ثبت نشده است.
        </p>
      </div>

      <button className='h-11 rounded-full bg-slate-900 px-8 text-white hover:bg-slate-800'>
        ثبت نظر
      </button>
    </div>
  </div>
</section>
    </div>
  )
}
