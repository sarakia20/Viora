'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

export default function ZarinPalSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type='submit' className='mt-2 h-12 w-full min-w-0 max-w-full whitespace-normal break-words rounded-2xl px-3 py-1 text-base font-semibold leading-5 shadow-sm' disabled={pending} aria-busy={pending}>
      {pending ? 'در حال اتصال به درگاه...' : 'پرداخت با زرین‌پال'}
    </Button>
  )
}
