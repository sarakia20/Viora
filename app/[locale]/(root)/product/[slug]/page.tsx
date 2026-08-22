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
import ProductVariantDetails from '@/components/shared/product/product-variant-details'
import AddToBrowsingHistory from '@/components/shared/product/add-to-browsing-history'
import { Separator } from '@/components/ui/separator'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import RatingSummary from '@/components/shared/product/rating-summary'
import ProductSlider from '@/components/shared/product/product-slider'
import { getTranslations } from 'next-intl/server'
import { getCategoryLandingPath } from '@/lib/category-config'

const SITE_URL = 'https://viora-store.ir'
const SITE_NAME = 'فروشگاه ویورا'

function getAbsoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString()
}

function getSeoDescription(name: string, description?: string) {
  const fallback = `خرید ${name} از فروشگاه ویورا با مشاهده مشخصات، قیمت و وضعیت موجودی محصول.`
  const value = description?.trim().replace(/\s+/g, ' ') || fallback

  return value.length > 160 ? `${value.slice(0, 157).trimEnd()}…` : value
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const t = await getTranslations()
  const params = await props.params
  const product = await getProductBySlug(params.slug).catch(() => null)

  if (!product) {
    return { title: t('Product.Product not found') }
  }

  const title = `خرید ${product.name} | ${SITE_NAME}`
  const description = getSeoDescription(product.name, product.description)
  const canonical = getAbsoluteUrl(`/product/${product.slug}`)
  const image = product.images.find((item) => item?.trim())
  const images = image ? [getAbsoluteUrl(image)] : undefined

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
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

  const canonical = getAbsoluteUrl(`/product/${product.slug}`)
  const description = getSeoDescription(product.name, product.description)
  const images = product.images
    .filter((image) => image?.trim())
    .map(getAbsoluteUrl)
  const initialVariant = product.variants?.[0]
  const variantImage = initialVariant?.image?.trim()
    ? getAbsoluteUrl(initialVariant.image)
    : undefined
  const schemaImages = variantImage
    ? [variantImage, ...images.filter((image) => image !== variantImage)]
    : images
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: schemaImages,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'IRR',
      price: (initialVariant?.price ?? product.price) * 10,
      availability:
        (initialVariant?.countInStock ?? product.countInStock) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    ...(product.numReviews > 0 && product.avgRating > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.avgRating,
            reviewCount: product.numReviews,
          },
        }
      : {}),
  }
  const categoryParams = new URLSearchParams({ category: product.category })
  const categoryLandingPath = getCategoryLandingPath(product.category)
  const subCategory = product.subCategory?.trim()
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'خانه',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: product.category,
      item: getAbsoluteUrl(
        categoryLandingPath ?? `/search?${categoryParams.toString()}`
      ),
    },
  ]

  if (subCategory) {
    const subCategoryParams = new URLSearchParams({
      category: product.category,
      subCategory,
    })
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbItems.length + 1,
      name: subCategory,
      item: getAbsoluteUrl(`/search?${subCategoryParams.toString()}`),
    })
  }

  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: product.name,
    item: canonical,
  })

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  const relatedProducts = await getRelatedProductsByCategory({
    category: product.category,
    productId: product._id.toString(),
    page: Number(page || '1'),
  })

  const t = await getTranslations()

  return (
    <div>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <AddToBrowsingHistory id={product._id.toString()} category={product.category} />

      <section>
        {product.variants && product.variants.length > 0 ? (
          <ProductVariantDetails
            product={product}
            initialSize={size || product.sizes[0] || ''}
          />
        ) : (
        <div className='grid grid-cols-1 gap-5 md:grid-cols-5 md:gap-0'>
          <div className='min-w-0 md:col-span-2'>
            <ProductGallery images={product.images} />
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

              <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                <div className='flex gap-3'>
                  {product.countInStock > 0 && (
  <ProductPrice
    price={product.price}
    listPrice={product.listPrice}
    isDeal={product.tags.includes('todays-deal')}
    forListing={false}
  />
)}
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
              <div className='p-medium-16 lg:p-regular-18 space-y-1 leading-8'>
                {product.description
                  .split(/\r?\n/)
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line, index) => (
                    <p key={index} className='flex items-start gap-2'>
                      <span className='text-green-600' aria-hidden='true'>
                        ✓
                      </span>
                      <span>{line}</span>
                    </p>
                  ))}
              </div>
            </div>
          </div>

          <div className='md:sticky md:top-40 md:self-start'>
            <Card>
              <CardContent className='p-4 flex flex-col gap-4'>
                {product.countInStock > 0 && (
  <ProductPrice price={product.price} />
)}

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

{product.countInStock > 0 && (
  <div className='flex justify-center items-center'>
    <AddToCart
      item={{
        clientId: generateId(),
        product: product._id.toString(),
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
)}
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </section>

      <section className='mt-10 sm:mt-16'>
        <ProductSlider
          products={relatedProducts.data}
          title='محصولات مشابه'
        />
      </section>

      <section className='mt-10 sm:mt-12'>
        <ProductSlider
          products={relatedProducts.data}
          title='پرفروش‌ترین‌ها'
        />
      </section>

      <section className='mt-12'>
        <BrowsingHistoryList />
      </section>

      <section className='mt-10 pb-8 sm:mt-16 sm:pb-12' id='reviews'>
  <div className='rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8'>
    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
      <div className='space-y-2'>
        <h2 className='text-2xl font-bold text-slate-900'>نظرات کاربران</h2>
        <p className='text-slate-600'>
          هنوز نظری برای این محصول ثبت نشده است.
        </p>
      </div>

      <button className='h-11 w-full rounded-full bg-slate-900 px-8 text-white hover:bg-slate-800 sm:w-auto'>
        ثبت نظر
      </button>
    </div>
  </div>
</section>
    </div>
  )
}
