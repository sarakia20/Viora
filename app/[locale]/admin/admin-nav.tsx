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
        'flex items-center flex-wrap overflow-hidden gap-2 md:gap-4',
        className
      )}
      {...props}
    >
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            '',
            pathname.includes(item.href) ? '' : 'text-muted-foreground'
          )}
        >
          {(item.title)}
        </Link>
      ))}
    </nav>
  )
}
