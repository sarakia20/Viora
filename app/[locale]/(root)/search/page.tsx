
import Link from 'next/link'
import type { Metadata } from 'next'

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

import SearchSidebar from '@/components/shared/search-sidebar'
import MobileSearchControls from '@/components/shared/mobile-search-controls'

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

function FilterSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details
      open={defaultOpen}
      className="group border rounded-xl bg-card shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-bold select-none">
        {title}
        <ChevronLeft className="h-4 w-4 transition group-open:-rotate-90" />
      </summary>

      <div className="border-t px-4 py-3 space-y-1">{children}</div>
    </details>
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

type SearchMetadataParams = Record<string, string | string[] | undefined>

const SITE_URL = 'https://viora-store.ir'
const SITE_NAME = 'ویورا'

const categorySeo: Record<string, { title: string; description: string }> = {
  سینک: {
    title: 'خرید سینک ظرفشویی | قیمت و انواع سینک آشپزخانه | ویورا',
    description:
      'انواع سینک ظرفشویی و آشپزخانه را با بررسی مدل‌ها، مشخصات و قیمت در فروشگاه ویورا مقایسه و انتخاب کنید.',
  },
  شیرآلات: {
    title: 'خرید شیرآلات ساختمانی | قیمت انواع شیرآلات | ویورا',
    description:
      'انواع شیرآلات ساختمانی را با مشاهده مدل‌ها، مشخصات و قیمت در فروشگاه ویورا بررسی و برای فضای مورد نظر خود انتخاب کنید.',
  },
  'توالت فرنگی': {
    title: 'خرید توالت فرنگی | قیمت انواع توالت فرنگی | ویورا',
    description:
      'مدل‌های مختلف توالت فرنگی را با بررسی مشخصات، طراحی و قیمت در فروشگاه ویورا مقایسه و انتخاب کنید.',
  },
  اکسسوری: {
    title: 'خرید اکسسوری سرویس بهداشتی | قیمت و مدل‌ها | ویورا',
    description:
      'انواع اکسسوری سرویس بهداشتی را با مشاهده مدل‌ها، کاربرد و قیمت در فروشگاه ویورا بررسی و انتخاب کنید.',
  },
}

const subCategorySeo: Record<string, { title: string; description: string }> = {
  'شیر آشپزخانه': {
    title: 'خرید شیر آشپزخانه | قیمت انواع شیر ظرفشویی | ویورا',
    description:
      'انواع شیر آشپزخانه و شیر ظرفشویی را با بررسی طراحی، مشخصات و قیمت در فروشگاه ویورا مقایسه و انتخاب کنید.',
  },
  جامایع: {
    title: 'خرید جامایع | قیمت انواع جا مایع سرویس بهداشتی | ویورا',
    description:
      'مدل‌های مختلف جامایع سرویس بهداشتی را با مشاهده طراحی، جنس و قیمت در فروشگاه ویورا بررسی و انتخاب کنید.',
  },
  'جا مایع': {
    title: 'خرید جامایع | قیمت انواع جا مایع سرویس بهداشتی | ویورا',
    description:
      'مدل‌های مختلف جامایع سرویس بهداشتی را با مشاهده طراحی، جنس و قیمت در فروشگاه ویورا بررسی و انتخاب کنید.',
  },
  'توالت فرنگی یک تکه': {
    title: 'خرید توالت فرنگی یک تکه | قیمت و مدل‌ها | ویورا',
    description:
      'انواع توالت فرنگی یک تکه را با بررسی ابعاد، طراحی، مشخصات و قیمت در فروشگاه ویورا مقایسه و انتخاب کنید.',
  },
  'توالت فرنگی وال هنگ': {
    title: 'خرید توالت فرنگی وال هنگ | قیمت و مدل‌ها | ویورا',
    description:
      'انواع توالت فرنگی وال هنگ را با بررسی طراحی، ابعاد، مشخصات و قیمت در فروشگاه ویورا مقایسه و انتخاب کنید.',
  },
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata(props: {
  searchParams: Promise<SearchMetadataParams>
}): Promise<Metadata> {
  const searchParams = await props.searchParams
  const category = getSingleParam(searchParams.category)?.trim()
  const subCategory = getSingleParam(searchParams.subCategory)?.trim()
  const hasCategory = Boolean(category && category !== 'all')
  const hasSubCategory = Boolean(subCategory && subCategory !== 'all')
  const seo = hasSubCategory
    ? subCategorySeo[subCategory!] ?? {
        title: `خرید ${subCategory} | قیمت و مدل‌ها | ویورا`,
        description: `انواع ${subCategory} را با مشاهده مدل‌ها، مشخصات و قیمت در فروشگاه ویورا بررسی و انتخاب کنید.`,
      }
    : hasCategory
      ? categorySeo[category!] ?? {
          title: `خرید ${category} | قیمت و مدل‌ها | ویورا`,
          description: `انواع ${category} را با مشاهده مدل‌ها، مشخصات و قیمت در فروشگاه ویورا بررسی و انتخاب کنید.`,
        }
      : {
          title: 'جستجوی محصولات | ویورا',
          description: 'محصولات فروشگاه ویورا را جستجو و بر اساس نیاز خود مقایسه کنید.',
        }

  const canonicalParams = new URLSearchParams()
  if (hasCategory) canonicalParams.set('category', category!)
  if (hasSubCategory) canonicalParams.set('subCategory', subCategory!)
  const query = canonicalParams.toString()
  const canonical = new URL(`/search${query ? `?${query}` : ''}`, SITE_URL).toString()
  const allowedParams = new Set(['category', 'subCategory'])
  const hasExtraFilters = Object.keys(searchParams).some(
    (key) => !allowedParams.has(key)
  )
  const indexable = hasCategory && !hasExtraFilters

  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical },
    robots: { index: indexable, follow: true },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'fa_IR',
    },
  }
}

export default async function SearchPage(props: {
  searchParams: Promise<{
    q: string
    category: string
    subCategory: string
    brand: string
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
    subCategory = 'all',
    brand = 'all',
    tag = 'all',
    price = 'all',
    rating = 'all',
    sort = 'best-selling',
    page = '1',
  } = searchParams

  const params = {
    q,
    category,
    subCategory,
    brand,
    tag,
    price,
    rating,
    sort,
    page,
  }

  const categories = await getAllCategories()
  const tags = await getAllTags()
  const data = await getAllProducts({
    category,
    subCategory,
    brand,
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

    <div className='hidden md:block'>
      <ProductSortSelector
        sortOrders={sortOrders}
        sort={sort}
        params={params}
      />
    </div>
  </div>

  <MobileSearchControls
    categories={cleanCategories}
    tags={tags}
    params={params}
    rating={rating}
    price={price}
    tag={tag ?? 'all'}
    sortOrders={sortOrders}
    sort={sort}
  />

  <div className='mt-4 flex flex-wrap gap-2'>
    {category !== 'all' && category !== '' && (
      <span className='rounded-full border bg-slate-50 px-3 py-1 text-sm'>
        {category}
      </span>
    )}

    {subCategory !== 'all' && subCategory !== '' && (
      <Link
        href={getFilterUrl({ subCategory: 'all', params })}
        className='rounded-full border bg-slate-50 px-3 py-1 text-sm'
      >
        {subCategory} ×
      </Link>
    )}

    {brand !== 'all' && brand !== '' && (
      <Link
        href={getFilterUrl({ brand: 'all', params })}
        className='rounded-full border bg-slate-50 px-3 py-1 text-sm'
      >
        {brand} ×
      </Link>
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
      subCategory !== 'all' ||
      brand !== 'all' ||
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
       <aside className='hidden md:order-1 md:block'>
  <CollapsibleOnMobile title={t('Search.Filters')}>
    <div className='sticky top-4 space-y-4'>

      {/* SIDEBAR جدید (دیجی‌کالا استایل) */}
      <SearchSidebar
        categories={cleanCategories}
        tags={tags}
        params={params}
        rating={rating}
        price={price}
         tag={tag ?? 'all'}
      />

      

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
              <ProductCard key={product._id.toString()} product={product} />
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
