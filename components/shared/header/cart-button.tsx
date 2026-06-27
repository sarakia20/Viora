'use client'

import { ShoppingCartIcon } from 'lucide-react'
import Link from 'next/link'
import useIsMounted from '@/hooks/use-is-mounted'
import useShowSidebar from '@/hooks/use-cart-sidebar'
import useCartStore from '@/hooks/use-cart-store'
import { useLocale } from 'next-intl'
import { getDirection } from '@/i18n-config'

export default function CartButton() {
  const isMounted = useIsMounted()

  const {
    cart: { items },
  } = useCartStore()

  const cartItemsCount = items.reduce((a, c) => a + c.quantity, 0)

  const showSidebar = useShowSidebar()
  const locale = useLocale()

  return (
    <Link
      href='/cart'
      className='relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100'
      aria-label='سبد خرید'
    >
      <ShoppingCartIcon className='h-6 w-6 stroke-[1.8]' />

      {isMounted && cartItemsCount > 0 && (
        <span
          className={`absolute top-0 ${
            getDirection(locale) === 'rtl' ? 'right-0' : 'left-0'
          } flex min-h-5 min-w-5 items-center justify-center rounded-full bg-slate-800 px-1 text-[11px] font-bold text-white`}
        >
          {cartItemsCount}
        </span>
      )}

      {showSidebar && (
        <div
          className={`absolute top-[20px] ${
            getDirection(locale) === 'rtl'
              ? 'left-[-16px] rotate-[-270deg]'
              : 'right-[-16px] rotate-[-90deg]'
          } z-10 h-0 w-0 border-l-[7px] border-r-[7px] border-b-[8px] border-transparent border-b-background`}
        />
      )}
    </Link>
  )
}
