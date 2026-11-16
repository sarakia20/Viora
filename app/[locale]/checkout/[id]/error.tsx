'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function PaymentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Never log raw errors: provider responses and URLs may contain private data.
    console.error('[checkout] payment page failed', { stage: 'render_or_submit', digest: error.digest })
  }, [error])

  return (
    <div dir='rtl' className='space-y-4 p-6'>
      <p role='alert'>ارتباط با صفحه پرداخت برقرار نشد. صفحه را تازه‌سازی کنید و دوباره تلاش کنید. در صورت ادامه مشکل با پشتیبانی تماس بگیرید.</p>
      <Button type='button' onClick={reset}>تلاش دوباره</Button>
    </div>
  )
}
