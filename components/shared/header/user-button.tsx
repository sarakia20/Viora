import { auth } from '@/auth'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDownIcon, ChevronLeft, LayoutDashboard, Package, User, UserRound } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import UserMenuSignOut from './user-menu-sign-out'

export default async function UserButton({ mobile = false }: { mobile?: boolean }) {
  const t = await getTranslations()
  const session = await auth()

  if (!session) {
    if (mobile) return <Link href='/sign-in' aria-label={t('Header.Your account')} className='flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100'><UserRound className='h-6 w-6 stroke-[1.8]' /></Link>
    return (
      <Link
  href='/sign-in'
  className='inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'
>
  ورود / ثبت‌نام
</Link>
    )
  }

  const { name, email, role } = session.user
  const initial = Array.from(name?.trim() ?? '')[0]?.toLocaleUpperCase()
  const links = [
    { href: '/account', label: t('Header.Account menu.Account'), icon: User },
    { href: '/account/orders', label: t('Header.Account menu.Orders'), icon: Package },
  ]

  if (role === 'Admin') {
    links.push({ href: '/admin/overview', label: t('Header.Account menu.Admin'), icon: LayoutDashboard })
  }

  return (
    <div className='flex gap-2 items-center'>
      <DropdownMenu dir='rtl'>
        <DropdownMenuTrigger className='header-button' asChild>
          <button aria-label={mobile ? t('Header.Your account') : undefined} className={mobile ? 'flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100' : 'flex items-center gap-1 text-sm font-semibold'}>
            {mobile ? <UserRound className='h-6 w-6 stroke-[1.8]' /> : <>
            حساب کاربری
            <ChevronDownIcon className='h-4 w-4' />
          </>}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='start'
          sideOffset={8}
          collisionPadding={12}
          className='w-72 min-w-0 max-w-[calc(100vw-24px)] max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto rounded-2xl border-slate-200/80 bg-white p-2 text-right text-slate-800 shadow-[0_12px_32px_rgba(15,23,42,0.12)] duration-150 motion-reduce:!animate-none'
        >
          <DropdownMenuLabel className='flex items-center gap-3 px-2 py-3'>
            <span aria-hidden='true' className='flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white'>
              {initial || <User className='size-5' strokeWidth={1.6} />}
            </span>
            <div className='min-w-0 flex-1 space-y-1'>
              <p dir='auto' title={name ?? undefined} className='truncate text-sm font-semibold'>
                {name}
              </p>
              <p dir='ltr' title={email ?? undefined} className='truncate text-xs font-normal text-slate-500'>
                {email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className='mx-2 my-1 bg-slate-100' />
          <DropdownMenuGroup>
            {links.map(({ href, label, icon: Icon }) => (
              <DropdownMenuItem
                key={href}
                asChild
                className='min-h-11 cursor-pointer gap-3 rounded-lg px-3 font-medium duration-150 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400'
              >
                <Link href={href}>
                  <Icon aria-hidden='true' className='text-slate-600' strokeWidth={1.6} />
                  {label}
                  <ChevronLeft aria-hidden='true' className='ms-auto !size-3.5 text-slate-500' strokeWidth={1.8} />
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className='mx-2 my-1 bg-slate-100' />
          <UserMenuSignOut>{t('Header.Account menu.Sign out')}</UserMenuSignOut>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
