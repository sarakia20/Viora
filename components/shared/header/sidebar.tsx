'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  ChevronDown,
  MenuIcon,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const categoryGroups: Record<string, string[]> = {
  'چینی آلات بهداشتی': [
    'توالت فرنگی',
    'توالت ایرانی',
    'روشویی',
    'فلاش تانک',
  ],
  'تجهیزات آشپزخانه': ['هود', 'سینک', 'گاز', 'فر'],
  شیرآلات: [
    'شیر آشپزخانه',
    'شیر روشویی',
    'ست شیرآلات',
    'شیرآلات توکار',
  ],
  'کاشی و سرامیک': [
    'کاشی',
    'سرامیک',
    'کاشی دیوار',
    'سرامیک کف',
  ],
  اکسسوری: ['جامایع', 'جا دستمال کاغذی'],
}

const getCategoryHref = (category: string) =>
  `/search?category=${encodeURIComponent(category)}`

export default function Sidebar({
  categories,
}: {
  categories: string[]
}) {
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(
    'چینی آلات بهداشتی'
  )
  const [expandedMobileCategory, setExpandedMobileCategory] =
    useState<string | null>(null)

  const megaItems = Object.keys(categoryGroups).map((category) => ({
    title: category,
    children: categoryGroups[category] || [],
  }))

  const activeItem = megaItems.find(
    (item) => item.title === activeCategory
  )

  const closeAllMenus = () => {
    setDesktopOpen(false)
    setMobileOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      {/* Mobile trigger */}
      <button
        type='button'
        onClick={() => setMobileOpen(true)}
        className='flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm font-semibold text-slate-800 md:hidden'
        aria-label='باز کردن دسته‌بندی‌ها'
      >
        <MenuIcon className='h-5 w-5' />
        <span>همه</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className='fixed inset-0 z-[9999] md:hidden'>
          <button
            type='button'
            aria-label='بستن منو'
            className='absolute inset-0 bg-black/40'
            onClick={() => setMobileOpen(false)}
          />

          <aside className='absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl'>
            <div className='flex h-16 items-center justify-between border-b px-4'>
              <h2 className='text-lg font-bold text-slate-900'>
                دسته‌بندی محصولات
              </h2>

              <button
                type='button'
                onClick={() => setMobileOpen(false)}
                className='flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100'
                aria-label='بستن'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='flex-1 overflow-y-auto px-3 py-3'>
              {megaItems.map((item) => {
                const isExpanded =
                  expandedMobileCategory === item.title

                return (
                  <div
                    key={item.title}
                    className='border-b border-slate-100'
                  >
                    <div className='flex items-center'>
                      <Link
                        href={getCategoryHref(item.title)}
                        onClick={closeAllMenus}
                        className='flex-1 py-4 text-sm font-bold text-slate-800'
                      >
                        {item.title}
                      </Link>

                      <button
                        type='button'
                        onClick={() =>
                          setExpandedMobileCategory(
                            isExpanded ? null : item.title
                          )
                        }
                        className='flex h-11 w-11 items-center justify-center rounded-lg'
                        aria-label={`نمایش زیرمجموعه‌های ${item.title}`}
                      >
                        <ChevronDown
                          className={`h-5 w-5 text-slate-500 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {isExpanded && (
                      <div className='grid grid-cols-2 gap-2 pb-4'>
                        {item.children.map((child) => (
                          <Link
                            key={child}
                            href={getCategoryHref(child)}
                            onClick={closeAllMenus}
                            className='rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700'
                          >
                            {child}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className='border-t p-4'>
              <Link
                href='/search'
                onClick={closeAllMenus}
                className='flex h-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white'
              >
                مشاهده همه محصولات
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop trigger and mega menu */}
      <div
        className='relative hidden md:block'
        onMouseEnter={() => setDesktopOpen(true)}
        onMouseLeave={() => setDesktopOpen(false)}
      >
        <button
          type='button'
          className='flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white'
          onClick={() => setDesktopOpen((prev) => !prev)}
        >
          <MenuIcon className='h-5 w-5' />
          همه
        </button>

        {desktopOpen && (
          <div className='absolute right-0 top-full z-[9999] flex min-h-[420px] w-[min(820px,calc(100vw-2rem))] overflow-hidden rounded-b-xl border bg-white shadow-2xl'>
            <div className='w-64 shrink-0 border-l bg-slate-50 py-2'>
              {megaItems.map((item) => (
                <Link
                  key={item.title}
                  href={getCategoryHref(item.title)}
                  onClick={closeAllMenus}
                  onMouseEnter={() =>
                    setActiveCategory(item.title)
                  }
                  className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition ${
                    activeCategory === item.title
                      ? 'bg-white text-slate-900'
                      : 'text-slate-700 hover:bg-white hover:text-slate-950'
                  }`}
                >
                  <span>{item.title}</span>
                  <ChevronLeft className='h-4 w-4 text-slate-400' />
                </Link>
              ))}
            </div>

            <div className='flex-1 bg-white p-6'>
              {activeItem && (
                <>
                  <Link
                    href={getCategoryHref(activeItem.title)}
                    onClick={closeAllMenus}
                    className='mb-6 inline-flex items-center gap-1 text-sm font-bold text-slate-900'
                  >
                    همه محصولات {activeItem.title}
                    <ChevronLeft className='h-4 w-4' />
                  </Link>

                  <div className='grid grid-cols-2 gap-x-10 gap-y-4'>
                    {activeItem.children.map((child) => (
                      <Link
                        key={child}
                        href={getCategoryHref(child)}
                        onClick={closeAllMenus}
                        className='border-r-2 border-slate-800 pr-3 text-sm font-medium text-slate-700 transition hover:text-slate-950'
                      >
                        {child}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}