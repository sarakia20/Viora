import { HelpCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-screen px-3 py-3 sm:p-4'>
      <header className='mb-4 border-b bg-card'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-3'>
          <Link href='/'>
            <Image
              src='/icons/viora-logo.png'
              alt='logo'
              width={56}
              height={56}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          </Link>
          <div>
            <h1 className='text-lg font-bold sm:text-2xl md:text-3xl'> ثبت سفارش</h1>
          </div>
          <div>
            <Link href='/page/help'>
              <HelpCircle className='w-6 h-6' />
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
