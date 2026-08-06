import Image from 'next/image'
import Link from 'next/link'
import Menu from './menu'
import Search from './search'
import data from '@/lib/data'
import Sidebar from './sidebar'
import { getSetting } from '@/lib/actions/setting.actions'
import { getTranslations } from 'next-intl/server'

export default async function Header() {
  const { site } = await getSetting()
  const t = await getTranslations()
  const logoSrc = site.logo === '/icons/logo.svg' ? '/icons/viora-logo.png' : site.logo

  return (
    <header className='sticky top-0 z-50 bg-white text-slate-700 shadow-sm border-b border-slate-200'>

      <div className='mx-auto max-w-[1440px] px-3 sm:px-4 lg:px-6'>

        {/* Main header */}
        <div className='flex min-h-16 items-center justify-between gap-2'>

          <Link
            href='/'
            className='flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 text-lg font-extrabold text-slate-900 md:px-2 md:text-2xl'
          >
            <Image
              src={logoSrc}
              width={36}
              height={36}
              alt={`${site.name} logo`}
              className='rounded-md'
            />

            <span className='hidden xs:block'>
              {site.name}
            </span>
          </Link>


          <div className='hidden flex-1 px-4 md:block'>
            <Search />
          </div>


          <Menu />

        </div>


        {/* Mobile search */}
        <div className='pb-3 md:hidden'>
          <Search />
        </div>

      </div>


      {/* Navigation */}
      <div className='border-t border-slate-100 bg-slate-50'>

        <div className='mx-auto flex h-11 max-w-[1440px] items-center gap-2 overflow-visible px-3 sm:px-4 lg:px-6'>

          <Sidebar />


          <div className='flex flex-1 gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide'>

            {data.headerMenus
              .slice(0, 4)
              .map((menu) => (

              <Link
                href={menu.href}
                key={menu.href}
                className='shrink-0 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900'
              >
                {t('Header.' + menu.name)}
              </Link>

            ))}

          </div>

        </div>

      </div>

    </header>
  )
}
