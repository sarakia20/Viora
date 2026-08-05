'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

const links = [
  {
    title: 'داشبورد',
    href: '/admin/overview',
  },
  {
    title: 'محصولات',
    href: '/admin/products',
  },
  {
  title: 'دسته‌بندی‌ها',
  href: '/admin/categories',
},
  {
    title: 'سفارش‌ها',
    href: '/admin/orders',
  },
  {
    title: 'کاربران',
    href: '/admin/users',
  },
  {
    title: 'صفحات',
    href: '/admin/web-pages',
  },
  {
    title: 'تنظیمات',
    href: '/admin/settings',
  },
]
export function AdminNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const t = useTranslations('Admin')
  return (
    <nav
      className={cn(
        'flex max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap md:flex-wrap md:gap-4 md:overflow-visible',
        className
      )}
      {...props}
    >
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'shrink-0 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-100',
            pathname.includes(item.href)
              ? 'bg-slate-100 font-bold text-slate-900'
              : 'text-muted-foreground'
          )}
        >
          {(item.title)}
        </Link>
      ))}
    </nav>
  )
}
