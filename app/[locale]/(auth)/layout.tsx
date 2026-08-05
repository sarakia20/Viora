import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex min-h-screen flex-col items-center bg-slate-50'>
      <header className='mb-5 mt-6 sm:mb-6 sm:mt-10'>
        <Link href='/'>
          <Image
            src='/viora-logo.png'
            alt='logo'
            width={64}
            height={64}
            priority
          />
        </Link>
      </header>

      <main className='mx-auto w-full max-w-md px-3 pb-6 sm:px-4'>
        {children}
      </main>
    </div>
  )
}
