'use client'

import Link from 'next/link'
import { MenuIcon, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

const categoryGroups: Record<string, string[]> = {
  'چینی آلات بهداشتی': ['توالت فرنگی', 'توالت ایرانی', 'روشویی', 'فلاش تانک'],
  'تجهیزات آشپزخانه': ['هود', 'سینک', 'گاز'],
  شیرآلات: ['شیر آشپزخانه', 'شیر روشویی', 'ست شیرآلات', 'شیرآلات توکار'],
  'کاشی و سرامیک': ['کاشی', 'سرامیک', 'کاشی دیوار', 'سرامیک کف'],
  اکسسوری: ['جامایع', 'جا دستمال کاغذی'],
}

const getCategoryHref = (category: string) =>
  `/search?category=${encodeURIComponent(category)}`

export default function Sidebar({ categories }: { categories: string[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('چینی آلات بهداشتی')

  const megaItems = Object.keys(categoryGroups).map((category) => ({
    title: category,
    children: categoryGroups[category] || [],
  }))

  const activeItem = megaItems.find((item) => item.title === activeCategory)

  const closeMenu = () => setIsOpen(false)

  return (
    <div
      className='relative'
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className='header-button flex items-center gap-1 !p-2 font-semibold'
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <MenuIcon className='h-5 w-5' />
        همه
      </button>

      {isOpen && (
        <div className='absolute right-0 top-full z-[9999] flex min-h-[420px] w-[820px] overflow-hidden rounded-b-xl border bg-white shadow-2xl'>
          <div className='w-64 border-l bg-slate-50 py-2'>
            {megaItems.map((item) => (
              <Link
                key={item.title}
                href={getCategoryHref(item.title)}
                onClick={closeMenu}
                onMouseEnter={() => setActiveCategory(item.title)}
                className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition ${
                  activeCategory === item.title
                    ?  'bg-white text-slate-900'
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
                  onClick={closeMenu}
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
                      onClick={closeMenu}
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
  )
}