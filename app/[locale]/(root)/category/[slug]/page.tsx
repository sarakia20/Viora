import type { Metadata } from 'next'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache } from 'react'

import Pagination from '@/components/shared/pagination'
import ProductCard from '@/components/shared/product/product-card'
import { getCategoryConfig } from '@/lib/category-config'
import { getAllProducts } from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'
import { SITE_URL } from '@/lib/site-url'

import CategoryGuidePreview from './category-guide-preview'

const SITE_NAME = 'ویورا'

function getPageNumber(value: string | string[] | undefined) {
  if (value === undefined) return 1
  if (Array.isArray(value) || !/^\d+$/.test(value)) notFound()
  const page = Number(value)
  if (!Number.isSafeInteger(page) || page < 1) notFound()
  return page
}

type CategorySearchParams = Record<string, string | string[] | undefined>

// Metadata and the page share the same published-product query per request.
const getCategoryPage = cache(async (slug: string, page: number) => {
  const category = getCategoryConfig(slug)
  if (!category) notFound()
  const data = await getAllProducts({
    query: 'all',
    category: category.productCategories ?? category.productCategory,
    subCategory: 'all',
    brand: 'all',
    tag: 'all',
    price: 'all',
    rating: 'all',
    sort: 'best-selling',
    page,
  })
  if (page > Math.max(1, data.totalPages) ||
    (category.requireProducts && data.totalProducts === 0)) notFound()
  return { category, data }
})

function normalizePageUrl(slug: string, page: number, params: CategorySearchParams) {
  if (params.page === undefined || (page > 1 && params.page === String(page))) return
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (key === 'page' || value === undefined) continue
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item)
  }
  if (page > 1) query.set('page', String(page))
  permanentRedirect(`/category/${slug}${query.size ? `?${query}` : ''}`)
}

function getCanonical(slug: string, page: number) {
  const url = new URL(`/category/${slug}`, SITE_URL)

  if (page > 1) {
    url.searchParams.set('page', String(page))
  }

  return url.toString()
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<CategorySearchParams>
}): Promise<Metadata> {
  const [{ slug }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ])
  const page = getPageNumber(searchParams.page)
  const { category } = await getCategoryPage(slug, page)
  normalizePageUrl(slug, page, searchParams)
  const canonical = getCanonical(category.slug, page)
  const title =
    page > 1 ? `${category.title} - صفحه ${page}` : category.title

  return {
    title: { absolute: title },
    description: category.description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description: category.description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'fa_IR',
    },
  }
}

export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<CategorySearchParams>
}) {
  const [{ slug }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ])
  const page = getPageNumber(searchParams.page)
  const { category, data } = await getCategoryPage(slug, page)
  normalizePageUrl(slug, page, searchParams)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'خانه',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.productCategory,
        item: getCanonical(category.slug, 1),
      },
    ],
  }

  return (
    <div className='space-y-8'>
      <nav aria-label='مسیر راهنما' className='flex flex-wrap gap-2 text-sm text-muted-foreground'>
        <Link href='/'>خانه</Link>
        <span aria-hidden='true'>/</span>
        <Link href={`/category/${category.slug}`} aria-current='page'>{category.productCategory}</Link>
      </nav>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <header className='rounded-xl border bg-card p-5 sm:p-7'>
        <h1 className='text-2xl font-bold sm:text-3xl'>
          {category.h1}
        </h1>
        <p className='mt-3 max-w-4xl leading-8 text-muted-foreground'>
          {category.intro}
        </p>
      </header>

      <section aria-labelledby='category-products-title' className='space-y-5'>
        <div>
          <h2 id='category-products-title' className='text-xl font-bold'>
            محصولات {category.productCategory}
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {data.totalProducts} محصول یافت شد
          </p>
        </div>

        {data.products.length > 0 ? (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {data.products.map((product: IProduct) => (
              <ProductCard key={product._id.toString()} product={product} />
            ))}
          </div>
        ) : (
          <div className='rounded-xl border bg-card p-6 text-center text-muted-foreground'>
            محصولی در این دسته‌بندی پیدا نشد.
          </div>
        )}

        {data.totalPages > 1 && (
          <Pagination page={page} totalPages={data.totalPages} />
        )}
      </section>

      {page === 1 && (
        <section
          aria-labelledby='category-guide-title'
          className='w-full min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-right sm:p-6 lg:p-8'
          dir='rtl'
        >
          <h2 id='category-guide-title' className='flex items-start gap-2.5 text-xl font-bold text-slate-900 sm:text-2xl'>
            <BookOpen aria-hidden='true' className='mt-1 size-5 shrink-0 text-slate-600' />
            {category.guideTitle}
          </h2>
          <CategoryGuidePreview>
            {category.guideParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </CategoryGuidePreview>
          {category.guideLinks && (
            <nav aria-label='دسته‌های مرتبط' className='flex flex-wrap gap-x-5 gap-y-2'>
              {category.guideLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className='font-medium text-slate-800 underline-offset-4 hover:underline'
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </section>
      )}
    </div>
  )
}
