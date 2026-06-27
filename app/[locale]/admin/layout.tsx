import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Menu from '@/components/shared/header/menu'
import { AdminNav } from './admin-nav'
import { getSetting } from '@/lib/actions/setting.actions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { site } = await getSetting()

  return (
    <>
      <div className='flex flex-col min-h-screen bg-slate-50'>
        <div className='bg-white border-b shadow-sm'>
          <div className='flex h-16 items-center px-4'>
            <Link href='/' className='flex items-center gap-2'>
              <Image
                src='/icons/logo.svg'
                width={40}
                height={40}
                alt={`${site.name} logo`}
              />
            </Link>

            <AdminNav className='mx-8 hidden md:flex' />

            <div className='ml-auto flex items-center'>
              <Menu forAdmin />
            </div>
          </div>

          <div className='border-t bg-white'>
            <AdminNav className='flex md:hidden px-4 py-3' />
          </div>
        </div>

        <div className='flex-1 p-6'>
          {children}
        </div>
      </div>
    </>
  )
}
