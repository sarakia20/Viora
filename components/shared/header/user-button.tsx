import { auth } from '@/auth'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOut } from '@/lib/actions/user.actions'
import { ChevronDownIcon, UserRound } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

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

  return (
    <div className='flex gap-2 items-center'>
      <DropdownMenu>
        <DropdownMenuTrigger className='header-button' asChild>
          <button aria-label={mobile ? t('Header.Your account') : undefined} className={mobile ? 'flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100' : 'flex items-center gap-1 text-sm font-semibold'}>
            {mobile ? <UserRound className='h-6 w-6 stroke-[1.8]' /> : <>
            حساب کاربری
            <ChevronDownIcon className='h-4 w-4' />
          </>}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm font-medium leading-none'>
                {session.user.name}
              </p>
              <p className='text-xs leading-none text-muted-foreground'>
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuGroup>
            <Link className='w-full' href='/account'>
              <DropdownMenuItem>{t('Header.Your account')}</DropdownMenuItem>
            </Link>

            <Link className='w-full' href='/account/orders'>
              <DropdownMenuItem>{t('Header.Your orders')}</DropdownMenuItem>
            </Link>

            {session.user.role === 'Admin' && (
              <Link className='w-full' href='/admin/overview'>
                <DropdownMenuItem>{t('Header.Admin')}</DropdownMenuItem>
              </Link>
            )}
          </DropdownMenuGroup>

          <DropdownMenuItem className='p-0 mb-1'>
            <form action={SignOut} className='w-full'>
              <Button
                className='w-full py-4 px-2 h-4 justify-start'
                variant='ghost'
              >
                {t('Header.Sign out')}
              </Button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}