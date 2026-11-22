import { cache } from 'react'
import ProductInformation from '@/components/shared/product/product-information'
import AddToCart from '@/components/shared/product/add-to-cart'
import { Card, CardContent } from '@/components/ui/card'
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from '@/lib/actions/product.actions'

import { generateId, round2 } from '@/lib/utils'
import SelectVariant from '@/components/shared/product/select-variant'
import ProductPrice from '@/components/shared/product/product-price'
import ProductGallery from '@/components/shared/product/product-gallery'
import ProductVariantDetails from '@/components/shared/product/product-variant-details'
import ProductHighlights from '@/components/shared/product/product-highlights'
import { Separator } from '@/components/ui/separator'
import RatingSummary from '@/components/shared/product/rating-summary'
import ProductSlider from '@/components/shared/product/product-slider'
import { getTranslations } from 'next-intl/server'
import { getCategoryLandingPath } from '@/lib/category-config'
import { getAbsoluteUrl, SITE_URL } from '@/lib/site-url'
import { notFound } from 'next/navigation'
import { getProductDescription, getProductImageUrls, getProductJsonLd, getProductPath } from '@/lib/product-seo'

const SITE_NAME = 'فروشگاه ویورا'

const getPublicProductOrNotFound = cache(async (slug: string) => {
  try {
    const product = await getProductBySlug(slug)
    if (!product.isPublished) notFound()
    return product
  } catch (error) {
    if (error instanceof Error && error.message === 'Product not found') {
      notFound()
    }

    throw error
  }
})

function truncateSeoDescription(value: string, maxLength = 160) {
  if (value.length <= maxLength) return value

  const shortened = value.slice(0, maxLength - 1).trimEnd()
  const lastSpace = shortened.lastIndexOf(' ')
  const result = lastSpace > 0 ? shortened.slice(0, lastSpace) : shortened

  return `${result.replace(/[،؛:,.!?؟]+$/u, '')}…`
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params
  const product = await getPublicProductOrNotFound(params.slug)

  const title = `خرید ${product.name}`
  const openGraphTitle = `${title} | ${SITE_NAME}`
  const description = truncateSeoDescription(getProductDescription(product))
  const canonical = getAbsoluteUrl(getProductPath(product.slug))
  const imageUrls = getProductImageUrls(product)
  const images = imageUrls.length ? imageUrls : undefined

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: openGraphTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: openGraphTitle,
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

  const product = await getPublicProductOrNotFound(slug)

  const canonical = getAbsoluteUrl(getProductPath(product.slug))
  const productJsonLd = getProductJsonLd(product)
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
  const hasVariants = Boolean(product.variants?.length)
  const hasColorOptions = product.colors.length > 0
  const highlights = (
    <ProductHighlights
      description={product.description}
      showDivider={hasVariants || hasColorOptions}
    />
  )

  return (
    <div>
      {productJsonLd && <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c'),
        }}
      />}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <section>
        {hasVariants ? (
          <ProductVariantDetails
            product={product}
            initialSize={size || product.sizes[0] || ''}
            highlights={highlights}
          />
        ) : (
        <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(260px,0.8fr)] lg:gap-8'>
          <div className='min-w-0'>
            <ProductGallery images={product.images} productName={product.name} />
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

              {hasColorOptions && <Separator />}
            </div>

            {(hasColorOptions || product.sizes.length > 0) && (
              <div>
                <SelectVariant
                  product={product}
                  size={size || product.sizes[0]}
                  color={color || product.colors[0]}
                />
              </div>
            )}
            {highlights}
          </div>

          <div className='lg:sticky lg:top-40 lg:self-start'>
            <Card className='rounded-2xl border-slate-200 bg-slate-50/70 shadow-none'>
              <CardContent className='flex flex-col gap-5 p-5 sm:p-6'>
                {product.countInStock > 0 && (
  <ProductPrice detail price={product.price} listPrice={product.listPrice} />
)}

                {product.countInStock > 0 && product.countInStock <= 3 && (
                  <div className='text-destructive font-bold'>
                    {t('Product.Only X left in stock - order soon', {
                      count: product.countInStock,
                    })}
                  </div>
                )}

                {product.countInStock > 0 ? (
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

      <ProductInformation product={product} />

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
