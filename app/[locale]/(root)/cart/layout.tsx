import type { ReactNode } from 'react'
import { publicMetadata } from '@/lib/public-seo'

export const metadata = publicMetadata({
  title: 'سبد خرید | ویورا',
  description: 'محصولات انتخاب‌شده خود را در سبد خرید فروشگاه ویورا بررسی کنید.',
  path: '/cart',
  index: false,
})

export default function CartLayout({ children }: { children: ReactNode }) {
  return children
}
