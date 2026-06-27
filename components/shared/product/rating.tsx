import React from 'react'
import { Star } from 'lucide-react'

function toPersianNumber(num: string | number) {
  return num.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

export default function Rating({ rating = 0 }: { rating: number }) {
  return (
    <div className='inline-flex items-center gap-1 text-sm text-slate-700'>
      <span>{toPersianNumber(rating.toFixed(1))}</span>
      <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
    </div>
  )
}
