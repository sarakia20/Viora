import Image from 'next/image'
import Link from 'next/link'
import { getAllCategories } from '@/lib/actions/product.actions'
import Menu from './menu'
import Search from './search'
import data from '@/lib/data'
import Sidebar from './sidebar'
import { getSetting } from '@/lib/actions/setting.actions'
import { getTranslations } from 'next-intl/server'

export default async function Header() {
  const categories = await getAllCategories()
  const { site } = await getSetting()
  const t = await getTranslations()

  return (
    <header className='sticky top-0 z-50 bg-white text-slate-700 shadow-sm border-b border-slate-200'>
      <div className='px-3 md:px-5'>
        <div className='flex h-16 items-center justify-between gap-4'>
          <Link
            href='/'
            className='flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xl md:text-2xl font-extrabold text-slate-900 hover:bg-slate-100 transition'
          >
            <Image
              src={site.logo}
              width={38}
              height={38}
              alt={`${site.name} logo`}
              className='rounded-md'
            />
            <span>{site.name}</span>
          </Link>

          <div className='hidden md:block flex-1 max-w-2xl'>
            <Search />
          </div>

          <Menu />
        </div>

        <div className='md:hidden pb-3'>
          <Search />
        </div>
      </div>

      <div className='relative flex h-11 items-center gap-2 border-t border-slate-100 bg-slate-50 px-3 md:px-5 text-sm text-slate-700'>
        <Sidebar categories={categories} />

        <div className='flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide'>
          {data.headerMenus.map((menu) => (
            <Link
              href={menu.href}
              key={menu.href}
              className='rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm transition'
            >
              {t('Header.' + menu.name)}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
