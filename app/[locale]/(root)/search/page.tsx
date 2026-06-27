import Link from 'next/link'

import Pagination from '@/components/shared/pagination'
import ProductCard from '@/components/shared/product/product-card'
import { Button } from '@/components/ui/button'
import {
  getAllCategories,
  getAllProducts,
  getAllTags,
} from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'
import ProductSortSelector from '@/components/shared/product/product-sort-selector'
import { getFilterUrl, toSlug } from '@/lib/utils'
import Rating from '@/components/shared/product/rating'
import CollapsibleOnMobile from '@/components/shared/collapsible-on-mobile'
import { getTranslations } from 'next-intl/server'
import { ChevronLeft } from 'lucide-react'

const sortOrders = [
  { value: 'price-low-to-high', name: 'قیمت: کم به زیاد' },
  { value: 'price-high-to-low', name: 'قیمت: زیاد به کم' },
  { value: 'newest-arrivals', name: 'جدیدترین' },
  { value: 'avg-customer-review', name: 'بیشترین امتیاز' },
  { value: 'best-selling', name: 'پرفروش‌ترین' },
]

const prices = [
  { name: '۱ تا ۲۰ تومان', value: '1-20' },
  { name: '۲۱ تا ۵۰ تومان', value: '21-50' },
  { name: '۵۱ تا ۱۰۰۰ تومان', value: '51-1000' },
]

const kitchenSubCategories = [
  'هود',
  'سینک',
  'گاز',
]

const faucetSubCategories = [
  'شیر آشپزخانه',
  'شیر روشویی',
  'ست شیرآلات',
  'شیرآلات توکار',
]
const bathroomAccessoriesSubCategories = [
  'جا مایع',
  'جا دستمال',
]
const isFaucet = (c: string) =>
  c === 'شیرآلات'

const isKitchen = (c: string) =>
  c === 'تجهیزات آشپزخانه'

const isBathroomAccessories = (c: string) =>
  c === 'اکسسوری'

const getTagName = (tag: string) => {
  switch (tag) {
    case 'Best Seller':
    case 'best-seller':
      return 'پرفروش‌ترین'

    case 'Featured':
    case 'featured':
      return ' فروش ویژه'

    case 'New Arrival':
    case 'new-arrival':
      return 'جدیدترین'

    case 'Todays Deal':
    case 'todays-deal':
      return 'پیشنهاد امروز'

    default:
      return tag
  }
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition hover:bg-muted ${
        active
  ? 'bg-slate-100 font-bold text-slate-800'
  : 'text-slate-700'
      }`}
    >
      <span>{children}</span>
      <ChevronLeft className='h-4 w-4 text-muted-foreground' />
    </Link>
  )
}

function FilterBox({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className='rounded-xl border bg-card p-4 shadow-sm'>
      <div className='mb-3 text-base font-bold'>{title}</div>
      <div className='space-y-1'>{children}</div>
    </div>
  )
}

export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string
    category: string
    tag: string
    price: string
    rating: string
    sort: string
    page: string
  }>
}) {
  const searchParams = await props.searchParams
  const t = await getTranslations()
  const {
    q = 'all',
    category = 'all',
    tag = 'all',
    price = 'all',
    rating = 'all',
  } = searchParams

  if (
    (q !== 'all' && q !== '') ||
    category !== 'all' ||
    tag !== 'all' ||
    rating !== 'all' ||
    price !== 'all'
  ) {
    return {
      title: `${t('Search.Search')} ${q !== 'all' ? q : ''}
          ${category !== 'all' ? ` : ${t('Search.Category')} ${category}` : ''}
          ${tag !== 'all' ? ` : ${t('Search.Tag')} ${tag}` : ''}
          ${price !== 'all' ? ` : ${t('Search.Price')} ${price}` : ''}
          ${rating !== 'all' ? ` : ${t('Search.Rating')} ${rating}` : ''}`,
    }
  }

  return {
    title: t('Search.Search Products'),
  }
}

export default async function SearchPage(props: {
  searchParams: Promise<{
    q: string
    category: string
    tag: string
    price: string
    rating: string
    sort: string
    page: string
  }>
}) {
  const searchParams = await props.searchParams

  const {
    q = 'all',
    category = 'all',
    tag = 'all',
    price = 'all',
    rating = 'all',
    sort = 'best-selling',
    page = '1',
  } = searchParams

  const params = { q, category, tag, price, rating, sort, page }

  const categories = await getAllCategories()
  const tags = await getAllTags()
  const data = await getAllProducts({
    category,
    tag,
    query: q,
    price,
    rating,
    page: Number(page),
    sort,
  })

  const t = await getTranslations()

const cleanCategories = categories.filter(
  (c: string) =>
    !faucetSubCategories.includes(c) &&
    !kitchenSubCategories.includes(c) &&
    !bathroomAccessoriesSubCategories.includes(c)
)

  return (
    <div className='space-y-4'>
      <div className='rounded-xl border bg-card p-4'>
  <div className='flex flex-wrap items-center justify-between gap-3'>
    <div>
      <h2 className='text-lg font-bold'>نتایج جستجو</h2>
      <p className='text-sm text-muted-foreground'>
        {data.totalProducts} محصول یافت شد
      </p>
    </div>

    <ProductSortSelector
      sortOrders={sortOrders}
      sort={sort}
      params={params}
    />
  </div>

  <div className='mt-4 flex flex-wrap gap-2'>
    {category !== 'all' && category !== '' && (
      <span className='rounded-full border bg-slate-50 px-3 py-1 text-sm'>
        {category}
      </span>
    )}

    {tag !== 'all' && tag !== '' && (
      <span className='rounded-full border bg-slate-50 px-3 py-1 text-sm'>
        {tag === 'best-seller' ? 'پرفروش‌ترین' : tag}
      </span>
    )}

    {rating !== 'all' && (
      <span className='rounded-full border bg-slate-50 px-3 py-1 text-sm'>
        {rating} ستاره به بالا
      </span>
    )}

    {price !== 'all' && (
      <span className='rounded-full border bg-slate-50 px-3 py-1 text-sm'>
        {price}
      </span>
    )}

    {((q !== 'all' && q !== '') ||
      category !== 'all' ||
      tag !== 'all' ||
      rating !== 'all' ||
      price !== 'all') && (
      <Link
        href='/search'
        className='rounded-full bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100'
      >
        حذف همه فیلترها
      </Link>
    )}
  </div>

      </div>

      <div className='grid gap-5 bg-background md:grid-cols-[280px_1fr]'>
        <aside className='order-2 md:order-1'>
          <CollapsibleOnMobile title={t('Search.Filters')}>
            <div className='sticky top-4 space-y-4'>
              <FilterBox title={t('Search.Department')}>
                <FilterLink
                  href={getFilterUrl({ category: 'all', params })}
                  active={category === 'all' || category === ''}
                >
                  {t('Search.All')}
                </FilterLink>

                {cleanCategories.map((c: string) => {
  if (isFaucet(c)) {
    const isOpen =
      category === c || faucetSubCategories.includes(category)

    return (
      <details key={c} className='group' open={isOpen}>
        <summary className='flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted'>
          <span className={category === c ? 'font-bold' : ''}>
            {c}
          </span>
        </summary>

        <div className='mt-1 mr-3 space-y-1'>
          <FilterLink href={getFilterUrl({ category: c, params })}>
            همه شیرآلات
          </FilterLink>

          {faucetSubCategories.map((sub) => (
            <FilterLink
              key={sub}
              href={getFilterUrl({ category: sub, params })}
              active={category === sub}
            >
              {sub}
            </FilterLink>
          ))}
        </div>
      </details>
    )
  }

  if (isKitchen(c)) {
    const isOpen =
      category === c || kitchenSubCategories.includes(category)

    return (
      <details key={c} className='group' open={isOpen}>
        <summary className='flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted'>
          <span className={category === c ? 'font-bold' : ''}>
            {c}
          </span>
        </summary>

        <div className='mt-1 mr-3 space-y-1'>
          <FilterLink href={getFilterUrl({ category: c, params })}>
            همه تجهیزات آشپزخانه
          </FilterLink>

          {kitchenSubCategories.map((sub) => (
            <FilterLink
              key={sub}
              href={getFilterUrl({ category: sub, params })}
              active={category === sub}
            >
              {sub}
            </FilterLink>
          ))}
        </div>
      </details>
    )
  }

  if (isBathroomAccessories(c)) {
  const isOpen =
    category === 'اکسسوری' ||
    bathroomAccessoriesSubCategories.includes(category)

  return (
    <details key={c} className='group' open={isOpen}>
      <summary className='flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm transition hover:bg-muted'>
        <span
          className={
            category === 'اکسسوری'
              ? 'font-bold text-slate-800'
              : 'text-slate-700'
          }
        >
          اکسسوری
        </span>

        <ChevronLeft className='h-4 w-4 text-muted-foreground transition group-open:-rotate-90' />
      </summary>

      <div className='mt-1 mr-3 border-r pr-3 space-y-1'>
        

        {bathroomAccessoriesSubCategories.map((sub) => (
          <FilterLink
            key={sub}
            href={getFilterUrl({ category: sub, params })}
            active={category === sub}
          >
            {sub}
          </FilterLink>
        ))}
      </div>
    </details>
  )
}

  return (
    <FilterLink
      key={c}
      href={getFilterUrl({ category: c, params })}
      active={category === c}
    >
      {c}
    </FilterLink>
  )
})

        
  }
              </FilterBox>

              <FilterBox title={t('Search.Price')}>
                <FilterLink
                  href={getFilterUrl({ price: 'all', params })}
                  active={price === 'all'}
                >
                  {t('Search.All')}
                </FilterLink>

                {prices.map((p) => (
                  <FilterLink
                    key={p.value}
                    href={getFilterUrl({ price: p.value, params })}
                    active={p.value === price}
                  >
                    {p.name}
                  </FilterLink>
                ))}
              </FilterBox>

              <FilterBox title={t('Search.Customer Review')}>
                <FilterLink
                  href={getFilterUrl({ rating: 'all', params })}
                  active={rating === 'all'}
                >
                  {t('Search.All')}
                </FilterLink>

                <FilterLink
                  href={getFilterUrl({ rating: '4', params })}
                  active={rating === '4'}
                >
                  <span className='flex items-center gap-1'>
                    <Rating size={4} rating={4} /> {t('Search.& Up')}
                  </span>
                </FilterLink>
              </FilterBox>

              <FilterBox title={t('Search.Tag')}>
                <FilterLink
                  href={getFilterUrl({ tag: 'all', params })}
                  active={tag === 'all' || tag === ''}
                >
                  {t('Search.All')}
                </FilterLink>

                {tags.map((tagItem: string) => (
                  <FilterLink
                    key={tagItem}
                    href={getFilterUrl({ tag: tagItem, params })}
                    active={toSlug(tagItem) === tag}
                  >
                    {getTagName(tagItem)}
                  </FilterLink>
                ))}
              </FilterBox>
            </div>
          </CollapsibleOnMobile>
        </aside>

        <main className='order-1 space-y-4 md:order-2'>
          <div className='rounded-xl border bg-card p-4'>
            <div className='text-xl font-bold'>{t('Search.Results')}</div>
            <div className='mt-1 text-sm text-muted-foreground'>
              {t('Search.Check each product page for other buying options')}
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {data.products.length === 0 && (
              <div>{t('Search.No product found')}</div>
            )}

            {data.products.map((product: IProduct) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <Pagination page={page} totalPages={data.totalPages} />
          )}
        </main>
      </div>
    </div>
  )
}
