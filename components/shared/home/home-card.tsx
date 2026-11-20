'use client'

import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useId, useState } from 'react'
import {
  categoryGroups,
  getCategoryHref,
  getSubCategoryHref,
} from '@/lib/store-category-menu'

const cards = [
  { group: 'چینی آلات بهداشتی', title: 'چینی‌آلات بهداشتی', image: 'viora-sanitary.webp' },
  { group: 'تجهیزات آشپزخانه', title: 'تجهیزات آشپزخانه', image: 'viora-kitchen.webp' },
  { group: 'شیرآلات', title: 'شیرآلات', image: 'viora-faucets.webp' },
  { group: 'کاشی و سرامیک', title: 'کاشی و سرامیک', image: 'viora-tiles-900.webp' },
  { group: 'اکسسوری', title: 'اکسسوری', image: 'viora-accessories.webp' },
  { group: 'کف شور', title: 'کف‌شور', image: 'viora-floor-drain-white-gray-900.webp' },
] as const

export function HomeCard() {
  const id = useId()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [openSubcategory, setOpenSubcategory] = useState<string | null>(null)

  return (
    <section aria-label='دسته‌بندی محصولات' className='grid grid-cols-2 items-start gap-3 sm:gap-4 md:grid-cols-3'>
      {cards.map(({ group, title, image }, index) => {
        const expanded = openGroup === group
        const panelId = `${id}-${index}`
        const categoryLinks = group === 'تجهیزات آشپزخانه' || group === 'کاشی و سرامیک'

        return (
          <article key={group} className='min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900'>
            <h2>
              <button
                type='button'
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => {
                  setOpenGroup(expanded ? null : group)
                  setOpenSubcategory(null)
                }}
                className='block w-full text-start hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-700'
              >
                <span className='relative block aspect-square bg-slate-50'>
                  <Image
                    src={`/images/${image}`}
                    alt=''
                    fill
                    sizes='(min-width: 768px) 33vw, 50vw'
                    className='object-cover'
                  />
                </span>
                <span className='flex min-h-12 items-center justify-between gap-1 px-2 py-2 text-xs font-bold sm:px-4 sm:text-base'>
                  {title}
                  <ChevronDown
                    aria-hidden='true'
                    className={`h-4 w-4 shrink-0 text-slate-600 motion-safe:transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
            </h2>

            <div
              id={panelId}
              inert={!expanded}
              className={`grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 motion-safe:ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className='min-h-0 overflow-hidden'>
                <ul className='max-h-[200px] overflow-y-auto overscroll-y-contain border-t border-slate-200 bg-slate-50 px-1.5 py-1 [scrollbar-width:none] sm:px-3 md:max-h-[224px] [&::-webkit-scrollbar]:hidden'>
                  {categoryGroups[group].map(({ title, children }, childIndex) => {
                    const rowClass = 'flex min-h-9 items-center rounded-md px-2 py-1 text-xs font-semibold hover:bg-white sm:text-sm'
                    const label = <span className='line-clamp-2 min-w-0 whitespace-normal break-words'>{title}</span>

                    if (!children?.length) {
                      // The existing hood filter works even when its landing page has no published products.
                      const href = title === 'هود'
                        ? `/search?category=${encodeURIComponent(title)}`
                        : categoryLinks
                          ? getCategoryHref(title)
                          : getSubCategoryHref(group, title)

                      return (
                        <li key={title}>
                          <Link href={href} className={rowClass}>
                            {label}
                          </Link>
                        </li>
                      )
                    }

                    const subcategoryId = `${panelId}-${childIndex}`
                    const subcategoryExpanded = expanded && openSubcategory === title

                    return (
                      <li key={title}>
                        <button
                          type='button'
                          aria-expanded={subcategoryExpanded}
                          aria-controls={subcategoryId}
                          onClick={() => setOpenSubcategory(subcategoryExpanded ? null : title)}
                          className={`${rowClass} w-full justify-between gap-1 text-start`}
                        >
                          {label}
                          <ChevronDown
                            aria-hidden='true'
                            className={`h-4 w-4 shrink-0 text-slate-600 motion-safe:transition-transform ${subcategoryExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                        <ul id={subcategoryId} hidden={!subcategoryExpanded} className='ms-2 border-s border-slate-200'>
                          {children.map((child) => (
                            <li key={child}>
                              <Link
                                href={getSubCategoryHref(title, child)}
                                className='flex min-h-9 items-center rounded-md px-2 py-1 text-xs text-slate-700 hover:bg-white sm:text-sm'
                              >
                                <span className='line-clamp-2 min-w-0 whitespace-normal break-words'>{child}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
