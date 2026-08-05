import React from 'react'

import Header from '@/components/shared/header'
import Footer from '@/components/shared/footer'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-3 py-4 sm:px-4 lg:px-6'>
        {children}
      </main>
      <Footer />
    </div>
  )
}
