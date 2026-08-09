import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Menu from '@/components/shared/header/menu'
import { AdminNav } from './admin-nav'
import { getSetting } from '@/lib/actions/setting.actions'
import { requireAdmin } from '@/lib/auth-guard'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  const { site } = await getSetting()

  return (
    <>
      <div className='flex flex-col min-h-screen bg-slate-50'>
        <div className='bg-white border-b shadow-sm'>
          <div className='mx-auto flex h-16 w-full max-w-[1440px] items-center px-3 sm:px-4'>
            <Link href='/' className='flex items-center gap-2'>
              <Image
                src='/icons/viora-logo.png'
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

          <div className='border-t bg-white md:hidden'>
            <AdminNav className='flex px-3 py-2 sm:px-4' />
          </div>
        </div>

        <div className='mx-auto w-full max-w-[1440px] flex-1 px-3 py-4 sm:px-4 lg:p-6'>
          {children}
        </div>
      </div>
    </>
  )
}
