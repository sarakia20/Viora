'use client'

import React from 'react'
import useSettingStore from '@/hooks/use-setting-store'
import { cn, round2 } from '@/lib/utils'
import { useLocale } from 'next-intl'

function formatNumber(value: number, isFa: boolean) {
  return new Intl.NumberFormat(isFa ? 'fa-IR' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

function getDiscountPercent(price: number, listPrice: number) {
  if (!listPrice || listPrice <= 0) return 0
  return Math.round(100 - (price / listPrice) * 100)
}

export default function ProductPrice({
  price,
  listPrice = 0,
  className,
  plain = false,
  detail = false,
}: {
  price: number
  listPrice?: number
  className?: string
  isDeal?: boolean
  forListing?: boolean
  plain?: boolean
  detail?: boolean
}) {
  const locale = useLocale()
  const isFa = locale.startsWith('fa')
  const setting = useSettingStore((state) => state.setting)

  const currency =
    setting.availableCurrencies.find((c) => c.code === setting.currency) ||
    setting.availableCurrencies[0]

const convertedPrice = round2(price)
const convertedListPrice = round2(listPrice)

  const hasDiscount =
    convertedListPrice > 0 && convertedListPrice > convertedPrice

  const discountPercent = hasDiscount
    ? getDiscountPercent(convertedPrice, convertedListPrice)
    : 0

  const mainPrice = formatNumber(convertedPrice, isFa)
  const oldPrice = formatNumber(convertedListPrice, isFa)
  const discountText = formatNumber(discountPercent, isFa)

  if (plain) {
    return (
      <span className={cn('text-sm font-bold tabular-nums', className)}>
        {mainPrice} {isFa ? 'تومان' : currency.code}
      </span>
    )
  }

  return (
    <div
      dir={isFa ? 'rtl' : 'ltr'}
      className={cn(
        'w-full min-h-[38px] flex flex-col items-end justify-start text-right',
        className
      )}
    >
      <div className={cn('w-full flex items-center justify-end gap-1.5', detail && 'flex-wrap')}>
        {hasDiscount && (
          <span className={cn(
            'shrink-0 rounded-full bg-red-600 font-bold leading-none text-white',
            detail ? 'px-[7.5px] py-[2.5px] text-xs' : 'px-1.5 py-[2px] text-[10px]'
          )}>
            {discountText}٪
          </span>
        )}

        <div className='flex items-baseline gap-1 whitespace-nowrap'>
          <span className={cn('font-bold text-foreground tabular-nums', detail ? 'text-base leading-tight sm:text-3xl' : 'text-[16px] leading-none')}>
            {mainPrice}
          </span>
          <span className={cn('font-medium text-muted-foreground', detail ? 'text-sm' : 'text-[10px]')}>
            {isFa ? 'تومان' : currency.code}
          </span>
        </div>
      </div>

 {hasDiscount && (
  <div className='mt-1 w-full flex justify-end pl-[42px]'>
    <span className={cn('text-sm leading-none text-gray-400 line-through tabular-nums', detail && 'sm:text-base')}>
      {oldPrice}
    </span>
  </div>
)}
    </div>
  )
}
