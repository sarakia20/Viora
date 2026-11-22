'use client'

import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAdminDigits } from '@/lib/admin-display'
import type { ShippingAddress } from '@/types'

export default function ShippingDetails({ address }: { address?: ShippingAddress }) {
  const [feedback, setFeedback] = useState<{ label: string; message: string }>()

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(undefined), 2000)
    return () => window.clearTimeout(timer)
  }, [feedback])

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setFeedback({ label, message: 'کپی شد' })
    } catch {
      setFeedback({ label, message: 'کپی انجام نشد' })
    }
  }

  const fields = [
    { label: 'نام گیرنده', value: address?.fullName },
    { label: 'موبایل', value: address?.phone, copyable: true, numeric: true },
    { label: 'استان', value: address?.province },
    { label: 'شهر', value: address?.city },
    {
      label: 'نشانی کامل',
      value: address?.street,
      copyValue: [address?.country, address?.province, address?.city, address?.street]
        .map((part) => part?.trim()).filter(Boolean).join('، '),
      copyable: true,
      wide: true,
    },
    { label: 'کد پستی', value: address?.postalCode, copyable: true, numeric: true },
    { label: 'کشور', value: address?.country },
  ]

  return (
    <dl className='my-3 grid gap-1.5 sm:my-4 sm:grid-cols-2 sm:gap-2'>
      {fields.map(({ label, value, copyValue, copyable, numeric, wide }) => {
        const text = value?.trim()
        return (
          <div key={label} className={`min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 sm:py-3 ${wide ? 'sm:col-span-2' : ''}`}>
            <dt className='mb-1 text-xs font-medium text-slate-600'>{label}</dt>
            <dd className='flex min-h-9 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm font-semibold text-slate-900'>
              <bdi dir={numeric && text ? 'ltr' : 'auto'} className='min-w-0 whitespace-pre-line [overflow-wrap:anywhere]'>
                {text ? formatAdminDigits(text) : 'ثبت نشده'}
              </bdi>
              {copyable && text && (
                <Button type='button' variant='outline' size='sm' aria-label={`کپی ${label}`} onClick={() => copy(label, copyValue ?? text)}>
                  <Copy aria-hidden='true' className='size-4' />
                  کپی
                </Button>
              )}
              {copyable && (
                <span role='status' className='text-xs font-medium text-slate-700 empty:sr-only'>
                  {feedback?.label === label ? feedback.message : ''}
                </span>
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
