'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type PaginationProps = {
  page: number | string
  totalPages: number
  urlParamName?: string
}

const controlClass = 'size-8 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-none hover:bg-slate-50 hover:text-slate-800 focus-visible:ring-slate-600 sm:size-10'
const disabledClass = 'disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-100'

const Pagination = ({ page, totalPages, urlParamName }: PaginationProps) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPage = Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 1
  const parsedPage = Number(page)
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0
    ? Math.min(parsedPage, lastPage)
    : 1
  const getPageHref = (target: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(urlParamName || 'page', String(target))
    return `${pathname}?${params.toString()}`
  }
  // Keep the mobile controls compact even for a large product catalogue.
  const pages = Array.from(new Set([
    1, currentPage - 1, currentPage, currentPage + 1, lastPage,
  ])).filter((value) => value >= 1 && value <= lastPage).sort((a, b) => a - b)

  const t = useTranslations()
  const previousIcon = <ChevronLeft aria-hidden='true' className='rtl:rotate-180' />
  const nextIcon = <ChevronRight aria-hidden='true' className='rtl:rotate-180' />

  return (
    <nav aria-label='صفحه‌بندی' className='flex flex-wrap items-center justify-center gap-1 sm:gap-2'>
      {currentPage > 1 ? (
        <Button asChild size='icon' variant='outline' className={controlClass}>
          <Link href={getPageHref(currentPage - 1)} prefetch={false} rel='prev' aria-label={t('Search.Previous')}>
            {previousIcon}
          </Link>
        </Button>
      ) : (
        <Button type='button' size='icon' variant='outline' disabled className={cn(controlClass, disabledClass)} aria-label={t('Search.Previous')}>
          {previousIcon}
        </Button>
      )}
      {pages.map((value, index) => (
        <React.Fragment key={value}>
          {index > 0 && value - pages[index - 1] > 1 && (
            <span aria-hidden='true' className='w-3 shrink-0 text-center text-sm text-slate-500 sm:w-5'>…</span>
          )}
          <Button
            asChild
            size='icon'
            variant='outline'
            className={cn(
              controlClass,
              'text-xs tabular-nums sm:text-sm',
              value === currentPage && 'border-slate-800 bg-slate-800 text-white hover:bg-slate-800 hover:text-white'
            )}
          >
            <Link href={getPageHref(value)} prefetch={false} aria-label={`${t('Search.Page')} ${value}`} aria-current={value === currentPage ? 'page' : undefined}>
              {value}
            </Link>
          </Button>
        </React.Fragment>
      ))}
      {currentPage < lastPage ? (
        <Button asChild size='icon' variant='outline' className={controlClass}>
          <Link href={getPageHref(currentPage + 1)} prefetch={false} rel='next' aria-label={t('Search.Next')}>
            {nextIcon}
          </Link>
        </Button>
      ) : (
        <Button type='button' size='icon' variant='outline' disabled className={cn(controlClass, disabledClass)} aria-label={t('Search.Next')}>
          {nextIcon}
        </Button>
      )}
    </nav>
  )
}

export default Pagination
