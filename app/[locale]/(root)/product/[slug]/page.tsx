import { cache } from 'react'
import Link from 'next/link'
import ProductInformation from '@/components/shared/product/product-information'
import AddToCart from '@/components/shared/product/add-to-cart'
import { Card, CardContent } from '@/components/ui/card'
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from '@/lib/actions/product.actions'

import { generateId, round2 } from '@/lib/utils'
import { hasProductPrice } from '@/lib/product-display'
import { PRODUCT_IMAGE_PLACEHOLDER } from '@/lib/store-images'
import SelectVariant from '@/components/shared/product/select-variant'
import ProductPrice from '@/components/shared/product/product-price'
import ProductGallery from '@/components/shared/product/product-gallery'
import ProductVariantDetails from '@/components/shared/product/product-variant-details'
import ProductHighlights from '@/components/shared/product/product-highlights'
import { Separator } from '@/components/ui/separator'
import RatingSummary from '@/components/shared/product/rating-summary'
import ProductSlider from '@/components/shared/product/product-slider'
import { getTranslations } from 'next-intl/server'
import { brandHref, collectionHref, getBrandSlug, getProductCollection } from '@/lib/catalog-landings'
import { getCategoryLandingPath } from '@/lib/category-config'
import { parsePage, publicMetadata, type QueryParams } from '@/lib/public-seo'
import { getProductImageAlt, getRequestedVariantIndex } from '@/lib/product-variant'
import { getAbsoluteUrl } from '@/lib/site-url'
import { notFound } from 'next/navigation'
import { getProductDescription, getProductImageUrls, getProductJsonLd, getProductPath } from '@/lib/product-seo'

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

type ProductPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<QueryParams>
}

export async function generateMetadata(props: ProductPageProps) {
  const [{ slug }, query] = await Promise.all([props.params, props.searchParams])
  const product = await getPublicProductOrNotFound(slug)

  const title = `خرید ${product.name} | ویورا`
  const model = product.name.trim().replace(/\s+/g, ' ')
  const recordedDescription = getProductDescription(product)
  const facts = /(?:[\d۰-۹٠-٩][\d۰-۹٠-٩,.٬،\s]*\s*(?:تومان|ریال|﷼))/.test(recordedDescription)
    ? [product.brand, product.category].filter(Boolean).join('؛ ')
    : recordedDescription
  const summary = !facts || facts.startsWith(model) ? facts || model : `${model}؛ ${facts}`
  const description = truncateSeoDescription(summary)
  const requestedIndex = getRequestedVariantIndex(product, query)
  const hasSelection = query.color !== undefined || query.grade !== undefined
  const legacyColor = query.grade === undefined && typeof query.color === 'string' &&
    (!query.color || product.colors.includes(query.color))
  const index = !hasSelection || (product.variants?.length ? requestedIndex !== undefined : legacyColor)
  const images = getProductImageUrls(product, requestedIndex)
  return publicMetadata({
    title, description, path: getProductPath(product.slug),
    images: images.length ? images : undefined,
    index,
  })
}

export default async function ProductDetails(props: ProductPageProps) {
  const [searchParams, { slug }] = await Promise.all([props.searchParams, props.params])
  const product = await getPublicProductOrNotFound(slug)

  const selectedIndex = getRequestedVariantIndex(product, searchParams) ?? 0
  const size = typeof searchParams.size === 'string' && product.sizes.includes(searchParams.size)
    ? searchParams.size : product.sizes[0] || ''
  const color = typeof searchParams.color === 'string' && product.colors.includes(searchParams.color)
    ? searchParams.color : product.colors[0] || ''
  const productJsonLd = getProductJsonLd(product, selectedIndex)
  const breadcrumbs = [{ name: 'خانه', href: '/' }]
  const brandSlug = getBrandSlug(product.brand)
  const productBrandHref = brandSlug && brandHref(brandSlug)
  const collection = getProductCollection(product)
  if (product.category?.trim() && product.category !== 'all') {
    const selection = new URLSearchParams({ category: product.category })
    breadcrumbs.push({
      name: product.category.trim(),
      href: getCategoryLandingPath(product.category) ?? `/search?${selection}`,
    })
    if (collection) {
      breadcrumbs.push({ name: collection.label, href: collectionHref(collection.slug) })
    } else if (product.subCategory?.trim() && product.subCategory !== 'all') {
      selection.set('subCategory', product.subCategory)
      breadcrumbs.push({ name: product.subCategory.trim(), href: `/search?${selection}` })
    }
  }
  breadcrumbs.push({ name: product.name, href: getProductPath(product.slug) })

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map(({ name, href }, index) => ({
      '@type': 'ListItem', position: index + 1, name, item: getAbsoluteUrl(href),
    })),
  }

  const [relatedProducts, t] = await Promise.all([
    getRelatedProductsByCategory({
      category: product.category,
      productId: product._id.toString(),
      page: parsePage(searchParams.page) ?? 1,
    }),
    getTranslations(),
  ])
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

      <nav aria-label='مسیر راهنما' className='mb-3 flex flex-wrap gap-2 text-sm text-muted-foreground'>
        {breadcrumbs.map(({ href, name }, index) => (
          <span key={href} className='inline-flex items-center gap-2'>
            {index > 0 && <span aria-hidden='true'>/</span>}
            {index === breadcrumbs.length - 1
              ? <span aria-current='page'>{name}</span>
              : <Link href={href}>{name}</Link>}
          </span>
        ))}
      </nav>
      <section>
        {hasVariants ? (
          <ProductVariantDetails
            key={selectedIndex + ':' + size}
            product={product}
            initialSize={size}
            initialVariantIndex={selectedIndex}
            brandUrl={productBrandHref}
            highlights={highlights}
          />
        ) : (
        <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(260px,0.8fr)] lg:gap-8'>
          <div className='min-w-0'>
            <ProductGallery images={product.images} productName={getProductImageAlt(product)} />
          </div>

          <div className='flex min-w-0 w-full flex-col gap-6 lg:py-4'>
            <div className='flex flex-col gap-3'>
              <p className='w-fit rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600'>
                برند: {productBrandHref ? <Link href={productBrandHref} className='hover:underline'>{product.brand}</Link> : product.brand}
              </p>

              <h1 className='product-title text-xl font-bold leading-relaxed text-slate-900 lg:text-2xl'>{product.name}</h1>

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
                  size={size}
                  color={color}
                />
              </div>
            )}
            {highlights}
          </div>

          <div className='lg:sticky lg:top-40 lg:self-start'>
            <Card className='rounded-2xl border-slate-200 bg-slate-50/70 shadow-none'>
              <CardContent className='flex flex-col gap-5 p-5 sm:p-6'>
                <ProductPrice detail price={product.price} listPrice={product.listPrice} />

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

{product.countInStock > 0 && hasProductPrice(product.price) && (
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
        image: product.images[0] || PRODUCT_IMAGE_PLACEHOLDER,
        size,
        color,
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
