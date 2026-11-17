'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

type PaginationProps = {
  page: number | string
  totalPages: number
  urlParamName?: string
}

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
  return (
    <nav aria-label='صفحه‌بندی' className='flex flex-wrap items-center justify-center gap-2'>
      {currentPage > 1 ? <Button
        size='lg'
        variant='outline'
        asChild
        className='w-24'
      >
        <Link href={getPageHref(currentPage - 1)} prefetch={false} rel='prev'>
          <ChevronLeft /> {t('Search.Previous')}
        </Link>
      </Button> : <Button size='lg' variant='outline' disabled className='w-24'>
        <ChevronLeft /> {t('Search.Previous')}
      </Button>}
      <span>{t('Search.Page')} {currentPage} {t('Search.of')} {totalPages}</span>
      <div className='order-last flex w-full flex-wrap justify-center gap-2 sm:order-none sm:w-auto'>
        {pages.map((value, index) => (
          <React.Fragment key={value}>
            {index > 0 && value - pages[index - 1] > 1 && <span aria-hidden='true' className='self-center'>…</span>}
            <Button asChild size='icon' variant={value === currentPage ? 'default' : 'outline'}>
              <Link href={getPageHref(value)} prefetch={false} aria-label={`${t('Search.Page')} ${value}`} aria-current={value === currentPage ? 'page' : undefined}>
                {value}
              </Link>
            </Button>
          </React.Fragment>
        ))}
      </div>
      {currentPage < lastPage ? <Button
        size='lg'
        variant='outline'
        asChild
        className='w-24'
      >
        <Link href={getPageHref(currentPage + 1)} prefetch={false} rel='next'>
          {t('Search.Next')} <ChevronRight />
        </Link>
      </Button> : <Button size='lg' variant='outline' disabled className='w-24'>
        {t('Search.Next')} <ChevronRight />
      </Button>}
    </nav>
  )
}

export default Pagination
