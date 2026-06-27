'use client'
import React from 'react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <div className='p-6 rounded-lg shadow-md w-1/3 text-center'>
        <h1 className='text-3xl font-bold mb-4'>
          صفحه پیدا نشد
        </h1>

        <p className='text-destructive'>
          صفحه یا اطلاعات مورد نظر یافت نشد.
        </p>

        <Button
          variant='outline'
          className='mt-4 ml-2'
          onClick={() => (window.location.href = '/')}
        >
          بازگشت به صفحه اصلی
        </Button>
      </div>
    </div>
  )
}
