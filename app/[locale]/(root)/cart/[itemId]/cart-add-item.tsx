'use client'

import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import ProductPrice from '@/components/shared/product/product-price'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CheckCircle2Icon, ShieldCheck, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import useCartStore from '@/hooks/use-cart-store'
import { useTranslations } from 'next-intl'

export default function CartAddItem({ itemId }: { itemId: string }) {
  const {
    cart: { items, itemsPrice },
  } = useCartStore()

  const item = items.find((x) => x.clientId === itemId)
  const t = useTranslations('Cart')

  if (!item) return notFound()

  const totalItems = items.reduce((sum, cartItem) => {
    return sum + cartItem.quantity
  }, 0)

  return (
    <div className='bg-muted/30 py-6'>
      <div className='mx-auto max-w-5xl px-4'>
        <Card className='overflow-hidden rounded-2xl border bg-background shadow-sm'>
          <CardContent className='p-0'>
            <div className='border-b bg-green-50 px-5 py-4'>
              <div className='flex items-center gap-2 text-green-800'>
                <CheckCircle2Icon className='h-6 w-6' />

                <h1 className='text-lg font-bold'>
                  {t('Added to cart')}
                </h1>
              </div>
            </div>

            <div className='grid gap-6 p-5 md:grid-cols-[1fr_320px] md:p-7'>
              <div className='flex flex-col gap-5 sm:flex-row'>
                <Link
                  href={`/product/${item.slug}`}
                  className='flex h-40 w-full shrink-0 items-center justify-center rounded-xl border bg-white p-3 sm:w-40'
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={150}
                    height={150}
                    className='max-h-full w-auto object-contain'
                  />
                </Link>

                <div className='flex-1'>
                  <Link href={`/product/${item.slug}`}>
                    <h2 className='text-lg font-bold leading-8 hover:underline'>
                      {item.name}
                    </h2>
                  </Link>

                  <div className='mt-4 space-y-2 text-sm text-muted-foreground'>
                    {item.color && (
                      <p>
                        <span className='font-medium text-foreground'>
                          {t('Color')}:
                        </span>{' '}
                        {item.color}
                      </p>
                    )}

                    {item.size && (
                      <p>
                        <span className='font-medium text-foreground'>
                          {t('Size')}:
                        </span>{' '}
                        {item.size}
                      </p>
                    )}

                    <p>
                      <span className='font-medium text-foreground'>
                        {t('Quantity')}:
                      </span>{' '}
                      {item.quantity}
                    </p>
                  </div>

                  <div className='mt-5 flex flex-wrap gap-4 text-sm'>
                    <div className='flex items-center gap-2'>
                      <Truck className='h-5 w-5 text-green-700' />
                      <span>ارسال سریع به سراسر کشور</span>
                    </div>

                    <div className='flex items-center gap-2'>
                      <ShieldCheck className='h-5 w-5 text-green-700' />
                      <span>تضمین اصالت کالا</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='rounded-xl border bg-muted/30 p-5'>
                <div className='flex items-center justify-between border-b pb-4'>
                  <span className='font-bold'>
                    {t('Subtotal')}
                  </span>

                  <ProductPrice
                    className='text-xl font-bold'
                    price={itemsPrice}
                  />
                </div>

                <div className='mt-3 text-sm text-muted-foreground'>
                  {totalItems} {t('items')}
                </div>

                <Link
                  href='/checkout'
                  className={cn(
                    buttonVariants(),
                    'mt-5 h-11 w-full rounded-xl text-base'
                  )}
                >
                  {t('Proceed to Checkout')}
                </Link>

                <Link
                  href='/cart'
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'mt-3 h-11 w-full rounded-xl text-base'
                  )}
                >
                  {t('Go to Cart')}
                </Link>

                <Link
                  href='/'
                  className='mt-4 block text-center text-sm text-muted-foreground hover:text-foreground'
                >
                  ادامه خرید
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='mt-8'>
          <BrowsingHistoryList />
        </div>
      </div>
    </div>
  )
}
