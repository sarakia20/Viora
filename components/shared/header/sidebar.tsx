'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  ChevronDown,
  MenuIcon,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

type CategoryItem = {
  title: string
  children?: string[]
}

const categoryGroups: Record<string, CategoryItem[]> = {
  'چینی آلات بهداشتی': [
    {
      title: 'توالت فرنگی',
      children: [
        'توالت فرنگی یک تکه',
        'توالت فرنگی وال هنگ',
      ],
    },
    { title: 'توالت ایرانی' },
    { title: 'روشویی' },
    { title: 'فلاش تانک' },
  ],

  'تجهیزات آشپزخانه': [
    { title: 'هود' },
    {
      title: 'سینک',
      children: [
        'گرانیتی',
        'استیل توکار',
        'سینک های دست ساز',
      ],
    },
    { title: 'گاز' },
    { title: 'فر' },
    { title: 'ماکروویو' },
  ],

  شیرآلات: [
    { title: 'شیر آشپزخانه' },
    { title: 'شیر روشویی' },
    { title: 'ست شیرآلات' },
    { title: 'شیرآلات توکار' },
  ],

  'کاشی و سرامیک': [
    { title: 'کاشی' },
    { title: 'سرامیک' },
    { title: 'کاشی دیوار' },
    { title: 'سرامیک کف' },
  ],

  اکسسوری: [
    { title: 'جامایع' },
    { title: 'جا دستمال کاغذی' },
  ],
}

const getCategoryHref = (category: string) =>
  `/search?category=${encodeURIComponent(category)}`

const getSubCategoryHref = (category: string, subCategory: string) =>
  `/search?category=${encodeURIComponent(category)}&subCategory=${encodeURIComponent(subCategory)}`

export default function Sidebar() {
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const [activeCategory, setActiveCategory] = useState(
    'چینی آلات بهداشتی'
  )

  const [expandedMobileCategory, setExpandedMobileCategory] =
    useState<string | null>(null)

  const [expandedMobileChild, setExpandedMobileChild] =
    useState<string | null>(null)

  const [activeDesktopChild, setActiveDesktopChild] =
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
    setExpandedMobileCategory(null)
    setExpandedMobileChild(null)
    setActiveDesktopChild(null)
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      {/* ================= MOBILE ================= */}

      <button
        type='button'
        onClick={() => setMobileOpen(true)}
        className='flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm font-semibold text-slate-800 md:hidden'
        aria-label='باز کردن دسته‌بندی‌ها'
      >
        <MenuIcon className='h-5 w-5' />
        <span>همه</span>
      </button>

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
                      <div className='space-y-2 pb-4'>
                        {item.children.map((child) => {
                          const childExpanded =
                            expandedMobileChild === child.title

                          return (
                            <div
                              key={child.title}
                              className='overflow-hidden rounded-xl bg-slate-50'
                            >
                              <div className='flex items-center'>
                                <Link
                                  href={
                                    item.title === 'اکسسوری'
                                      ? getSubCategoryHref(
                                          item.title,
                                          child.title
                                        )
                                      : getCategoryHref(child.title)
                                  }
                                  onClick={closeAllMenus}
                                  className='flex-1 px-3 py-3 text-sm font-medium text-slate-800'
                                >
                                  {child.title}
                                </Link>

                                {child.children &&
                                  child.children.length > 0 && (
                                    <button
                                      type='button'
                                      onClick={() =>
                                        setExpandedMobileChild(
                                          childExpanded
                                            ? null
                                            : child.title
                                        )
                                      }
                                      className='flex h-11 w-11 items-center justify-center'
                                      aria-label={`نمایش زیرمجموعه‌های ${child.title}`}
                                    >
                                      <ChevronDown
                                        className={`h-4 w-4 text-slate-500 transition-transform ${
                                          childExpanded
                                            ? 'rotate-180'
                                            : ''
                                        }`}
                                      />
                                    </button>
                                  )}
                              </div>

                              {child.children && childExpanded && (
                                <div className='border-t border-slate-200 bg-white px-3 py-2'>
                                  {child.children.map((subChild) => (
                                    <Link
                                      key={subChild}
                                      href={
                                        child.title === 'سینک' ||
                                        child.title === 'توالت فرنگی'
                                          ? getSubCategoryHref(
                                              child.title,
                                              subChild
                                            )
                                          : getCategoryHref(subChild)
                                      }
                                      onClick={closeAllMenus}
                                      className='block border-b border-slate-100 py-3 pr-3 text-sm text-slate-600 last:border-b-0 hover:text-slate-900'
                                    >
                                      {subChild}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
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

      {/* ================= DESKTOP ================= */}

      <div
        className='relative hidden md:block'
        onMouseEnter={() => setDesktopOpen(true)}
        onMouseLeave={() => {
          setDesktopOpen(false)
          setActiveDesktopChild(null)
        }}
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
          <div className='absolute right-0 top-full z-[9999] flex min-h-[440px] w-[min(900px,calc(100vw-2rem))] overflow-hidden rounded-b-xl border bg-white shadow-2xl'>
            {/* Main categories */}
            <div className='w-64 shrink-0 border-l bg-slate-50 py-2'>
              {megaItems.map((item) => (
                <Link
                  key={item.title}
                  href={getCategoryHref(item.title)}
                  onClick={closeAllMenus}
                  onMouseEnter={() => {
                    setActiveCategory(item.title)
                    setActiveDesktopChild(null)
                  }}
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

            {/* Children */}
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

                  <div className='grid grid-cols-2 gap-x-12 gap-y-3'>
                    {activeItem.children.map((child) => {
                      const isOpen =
                        activeDesktopChild === child.title

                      return (
                        <div
                          key={child.title}
                          className='self-start'
                          onMouseEnter={() => {
                            if (child.children?.length) {
                              setActiveDesktopChild(child.title)
                            } else {
                              setActiveDesktopChild(null)
                            }
                          }}
                          onMouseLeave={() => {
                            if (child.children?.length) {
                              setActiveDesktopChild(null)
                            }
                          }}
                        >
                          <Link
                            href={
                              activeItem.title === 'اکسسوری'
                                ? getSubCategoryHref(
                                    activeItem.title,
                                    child.title
                                  )
                                : getCategoryHref(child.title)
                            }
                            onClick={closeAllMenus}
                            className='flex items-center justify-between rounded-lg border-r-2 border-slate-900 px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50'
                          >
                            <span>{child.title}</span>

                            {child.children &&
                              child.children.length > 0 && (
                                <ChevronDown
                                  className={`h-4 w-4 text-slate-400 transition-transform ${
                                    isOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              )}
                          </Link>

                          {child.children && isOpen && (
                            <div className='mr-5 mt-1 space-y-1 border-r border-slate-200 pr-4'>
                              {child.children.map((subChild) => (
                                <Link
                                  key={subChild}
                                  href={
                                    child.title === 'سینک' ||
                                    child.title === 'توالت فرنگی'
                                      ? getSubCategoryHref(
                                          child.title,
                                          subChild
                                        )
                                      : getCategoryHref(subChild)
                                  }
                                  onClick={closeAllMenus}
                                  className='block rounded-md px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-900'
                                >
                                  {subChild}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
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
