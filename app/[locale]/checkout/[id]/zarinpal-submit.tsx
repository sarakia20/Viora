'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

export default function ZarinPalSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type='submit' className='w-full rounded-full' disabled={pending} aria-busy={pending}>
      {pending ? 'در حال اتصال به درگاه...' : 'پرداخت با زرین‌پال'}
    </Button>
  )
}
