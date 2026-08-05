import { EllipsisVertical, X } from 'lucide-react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import CartButton from './cart-button'
import UserButton from './user-button'
import ThemeSwitcher from './theme-switcher'
import { getTranslations } from 'next-intl/server'

const Menu = async ({ forAdmin = false }: { forAdmin?: boolean }) => {
  const t = await getTranslations()

  return (
    <div className='flex shrink-0 items-center justify-end'>
      {/* Desktop */}
      <nav className='hidden items-center gap-2 md:flex'>
        <ThemeSwitcher />
        <UserButton />
        {forAdmin ? null : <CartButton />}
      </nav>

      {/* Mobile */}
      <nav className='md:hidden'>
        <Sheet>
          <SheetTrigger
            aria-label='باز کردن منوی حساب کاربری'
            className='flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100'
          >
            <EllipsisVertical className='h-6 w-6' />
          </SheetTrigger>

          <SheetContent
            side='left'
            className='flex w-[86%] max-w-sm flex-col border-r bg-white p-0 text-slate-900'
          >
            <SheetHeader className='border-b px-4 py-4 text-right'>
              <div className='flex items-center justify-between'>
                <SheetTitle className='text-base font-bold text-slate-900'>
                  {t('Header.Site Menu')}
                </SheetTitle>

                <SheetClose
                  aria-label='بستن منو'
                  className='flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100'
                >
                  <X className='h-5 w-5' />
                </SheetClose>
              </div>

              <SheetDescription className='sr-only'>
                منوی حساب کاربری، سبد خرید و تنظیمات
              </SheetDescription>
            </SheetHeader>

            <div className='flex flex-1 flex-col gap-2 overflow-y-auto p-4'>
              <div className='rounded-xl border bg-slate-50 p-3'>
                <UserButton />
              </div>

              {!forAdmin && (
                <div className='rounded-xl border bg-slate-50 p-3'>
                  <CartButton />
                </div>
              )}

              <div className='rounded-xl border bg-slate-50 p-3'>
                <ThemeSwitcher />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}

export default Menu
