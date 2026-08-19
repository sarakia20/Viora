import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import Pagination from '@/components/shared/pagination'
import ProductCard from '@/components/shared/product/product-card'
import { getCategoryConfig } from '@/lib/category-config'
import { getAllProducts } from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'

const SITE_URL = 'https://viora-store.ir'
const SITE_NAME = 'ویورا'

function getPageNumber(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value
  const page = Number(rawValue || '1')

  return Number.isInteger(page) && page > 0 ? page : 1
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
  searchParams: Promise<{ page?: string | string[] }>
}): Promise<Metadata> {
  const [{ slug }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ])
  const category = getCategoryConfig(slug)

  if (!category) {
    return {
      title: 'دسته‌بندی پیدا نشد',
      robots: { index: false, follow: false },
    }
  }

  const page = getPageNumber(searchParams.page)
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
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const [{ slug }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ])
  const category = getCategoryConfig(slug)

  if (!category) {
    notFound()
  }

  const page = getPageNumber(searchParams.page)
  const canonical = getCanonical(category.slug, page)
  const data = await getAllProducts({
    query: 'all',
    category: category.productCategory,
    subCategory: 'all',
    brand: 'all',
    tag: 'all',
    price: 'all',
    rating: 'all',
    sort: 'best-selling',
    page,
  })

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
        item: canonical,
      },
    ],
  }

  return (
    <div className='space-y-8'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <header className='rounded-xl border bg-card p-5 sm:p-7'>
        <h1 className='text-2xl font-bold sm:text-3xl'>
          {category.productCategory}
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
    </div>
  )
}
