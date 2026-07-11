import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col items-center min-h-screen'>
      <header className='mt-10 mb-6'>
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

      <main className='mx-auto w-full max-w-md px-4'>
        {children}
      </main>
    </div>
  )
}