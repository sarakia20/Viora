'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { getFilterUrl, toSlug } from '@/lib/utils'
import Rating from '@/components/shared/product/rating'

const prices = [
  { name: '۱ تا ۲۰ تومان', value: '1-20' },
  { name: '۲۱ تا ۵۰ تومان', value: '21-50' },
  { name: '۵۱ تا ۱۰۰۰ تومان', value: '51-1000' },
]

const faucetSubCategories = [
  'شیر آشپزخانه',
  'شیر روشویی',
  'ست شیرآلات',
  'شیرآلات توکار',
]

const kitchenSubCategories = ['هود', 'سینک', 'گاز']

const bathroomAccessoriesSubCategories = ['جا مایع', 'جا دستمال']

function getTagName(tag: string) {
  switch (tag) {
    case 'Best Seller':
    case 'best-seller':
      return 'پرفروش‌ترین'
    case 'Featured':
    case 'featured':
      return 'فروش ویژه'
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
        active ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-700'
      }`}
    >
      <span>{children}</span>
      <ChevronLeft className='h-4 w-4 text-muted-foreground' />
    </Link>
  )
}

function FilterSection({
  title,
  id,
  openSection,
  toggle,
  children,
}: {
  title: string
  id: string
  openSection: string | null
  toggle: (id: string) => void
  children: React.ReactNode
}) {
  const open = openSection === id

  return (
    <div className='overflow-hidden rounded-xl border bg-card shadow-sm'>
      <button
        type='button'
        onClick={() => toggle(id)}
        className='flex w-full items-center justify-between px-4 py-3 text-right font-bold'
      >
        <span>{title}</span>
        <ChevronLeft
          className={`h-4 w-4 transition ${open ? '-rotate-90' : ''}`}
        />
      </button>

      {open && <div className='space-y-1 border-t p-3'>{children}</div>}
    </div>
  )
}

function CategoryGroup({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className='group' open={defaultOpen}>
      <summary className='flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-muted'>
        <span>{title}</span>
        <ChevronLeft className='h-4 w-4 transition group-open:-rotate-90' />
      </summary>

      <div className='mt-1 space-y-1 border-r pr-3'>{children}</div>
    </details>
  )
}

export default function SearchSidebar({
  categories,
  tags,
  params,
  rating,
  price,
  tag,
}: {
  categories: string[]
  tags: string[]
  params: {
    q?: string
    category?: string
    tag?: string
    price?: string
    rating?: string
    sort?: string
    page?: string
  }
  rating: string
  price: string
  tag: string
}) {
  const [openSection, setOpenSection] = useState<string | null>('category')

  const toggle = (id: string) => {
    setOpenSection((current) => (current === id ? null : id))
  }

  const currentCategory = params.category || 'all'

  return (
    <div className='space-y-4'>
      <FilterSection
        title='دسته‌بندی'
        id='category'
        openSection={openSection}
        toggle={toggle}
      >
        <FilterLink
          href={getFilterUrl({ category: 'all', params })}
          active={currentCategory === 'all' || currentCategory === ''}
        >
          همه
        </FilterLink>

        {categories.map((c) => {
          if (c === 'شیرآلات') {
            return (
              <CategoryGroup
                key={c}
                title='شیرآلات'
                defaultOpen={
                  currentCategory === 'شیرآلات' ||
                  faucetSubCategories.includes(currentCategory)
                }
              >
                <FilterLink
                  href={getFilterUrl({ category: 'شیرآلات', params })}
                  active={currentCategory === 'شیرآلات'}
                >
                  همه شیرآلات
                </FilterLink>

                {faucetSubCategories.map((sub) => (
                  <FilterLink
                    key={sub}
                    href={getFilterUrl({ category: sub, params })}
                    active={currentCategory === sub}
                  >
                    {sub}
                  </FilterLink>
                ))}
              </CategoryGroup>
            )
          }

          if (c === 'تجهیزات آشپزخانه') {
            return (
              <CategoryGroup
                key={c}
                title='تجهیزات آشپزخانه'
                defaultOpen={
                  currentCategory === 'تجهیزات آشپزخانه' ||
                  kitchenSubCategories.includes(currentCategory)
                }
              >
                <FilterLink
                  href={getFilterUrl({
                    category: 'تجهیزات آشپزخانه',
                    params,
                  })}
                  active={currentCategory === 'تجهیزات آشپزخانه'}
                >
                  همه تجهیزات آشپزخانه
                </FilterLink>

                {kitchenSubCategories.map((sub) => (
                  <FilterLink
                    key={sub}
                    href={getFilterUrl({ category: sub, params })}
                    active={currentCategory === sub}
                  >
                    {sub}
                  </FilterLink>
                ))}
              </CategoryGroup>
            )
          }

          if (c === 'اکسسوری') {
            return (
              <CategoryGroup
                key={c}
                title='اکسسوری'
                defaultOpen={
                  currentCategory === 'اکسسوری' ||
                  bathroomAccessoriesSubCategories.includes(currentCategory)
                }
              >
                {bathroomAccessoriesSubCategories.map((sub) => (
                  <FilterLink
                    key={sub}
                    href={getFilterUrl({ category: sub, params })}
                    active={currentCategory === sub}
                  >
                    {sub}
                  </FilterLink>
                ))}
              </CategoryGroup>
            )
          }

          return (
            <FilterLink
              key={c}
              href={getFilterUrl({ category: c, params })}
              active={currentCategory === c}
            >
              {c}
            </FilterLink>
          )
        })}
      </FilterSection>

      <FilterSection
        title='قیمت'
        id='price'
        openSection={openSection}
        toggle={toggle}
      >
        <FilterLink
          href={getFilterUrl({ price: 'all', params })}
          active={price === 'all'}
        >
          همه
        </FilterLink>

        {prices.map((p) => (
          <FilterLink
            key={p.value}
            href={getFilterUrl({ price: p.value, params })}
            active={price === p.value}
          >
            {p.name}
          </FilterLink>
        ))}
      </FilterSection>

      <FilterSection
        title='نظر مشتری'
        id='rating'
        openSection={openSection}
        toggle={toggle}
      >
        <FilterLink
          href={getFilterUrl({ rating: 'all', params })}
          active={rating === 'all'}
        >
          همه
        </FilterLink>

        <FilterLink
          href={getFilterUrl({ rating: '4', params })}
          active={rating === '4'}
        >
          <span className='flex items-center gap-1'>
            <Rating rating={4} /> به بالا
          </span>
        </FilterLink>
      </FilterSection>

      <FilterSection
        title='فروش ویژه'
        id='tag'
        openSection={openSection}
        toggle={toggle}
      >
        <FilterLink
          href={getFilterUrl({ tag: 'all', params })}
          active={tag === 'all' || tag === ''}
        >
          همه
        </FilterLink>

        {tags.map((tagItem) => (
          <FilterLink
            key={tagItem}
            href={getFilterUrl({ tag: tagItem, params })}
            active={tag === tagItem || tag === toSlug(tagItem)}
          >
            {getTagName(tagItem)}
          </FilterLink>
        ))}
      </FilterSection>
    </div>
  )
}