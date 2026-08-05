'use client'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import { Minus, Plus, Trash2 } from 'lucide-react'
import ProductPrice from '@/components/shared/product/product-price'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useCartStore from '@/hooks/use-cart-store'
import useSettingStore from '@/hooks/use-setting-store'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function CartPage() {
  const {
    cart: { items, itemsPrice },
    updateItem,
    removeItem,
  } = useCartStore()
  const router = useRouter()
  const {
    setting: {
      site,
      common: { freeShippingMinPrice },
    },
  } = useSettingStore()

  const t = useTranslations()
  return (
    <div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-4'>
        {items.length === 0 ? (
            <Card className='col-span-4 rounded-xl'>
            <CardHeader className='text-xl sm:text-3xl'>
               سبد خرید شما خالی است
            </CardHeader>
           <CardContent>
  <Link href='/' className='font-medium text-primary hover:underline'>
    بازگشت به صفحه اصلی و ادامه خرید
  </Link>
</CardContent>
          </Card>
        ) : (
          <>
            <div className='lg:col-span-3'>
              <Card className='rounded-xl'>
                <CardHeader className='pb-0 text-xl sm:text-3xl'>
                  سبد خرید
                </CardHeader>
                <CardContent className='p-4'>
                  <div className='flex justify-end border-b mb-4'>
                    قیمت
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.clientId}
                      className='flex flex-col justify-between gap-4 border-b py-4 sm:flex-row'
                    >
                      <Link href={`/product/${item.slug}`}>
                        <div className='relative mx-auto h-40 w-40 sm:mx-0'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes='20vw'
                            style={{
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                      </Link>

                      <div className='flex-1 space-y-4'>
                        <Link
                          href={`/product/${item.slug}`}
                          className='text-lg hover:no-underline  '
                        >
                          {item.name}
                        </Link>
                        <div>
                          <p className='text-sm'>
                            <span className='font-bold'>
                              {' '}
                              رنگ:{' '}
                            </span>{' '}
                            {item.color}
                          </p>
                         {item.size && (
  <p className='text-sm'>
    <span className='font-bold'>سایز: </span>
    {item.size}
  </p>
)}
                        </div>
                        <div className='flex flex-wrap items-center gap-2'>
                          <div className='flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 w-fit'>
  <button
    type='button'
    onClick={() => updateItem(item, item.quantity + 1)}
    disabled={item.quantity >= item.countInStock}
    className='text-slate-700 disabled:opacity-40'
  >
    <Plus className='h-4 w-4' />
  </button>

  <span className='min-w-5 text-center font-bold'>{item.quantity}</span>

  <button
    type='button'
    onClick={() =>
      item.quantity <= 1
        ? removeItem(item)
        : updateItem(item, item.quantity - 1)
    }
    className='text-slate-700'
  >
    {item.quantity <= 1 ? (
      <Trash2 className='h-4 w-4' />
    ) : (
      <Minus className='h-4 w-4' />
    )}
  </button>
</div>
                          <Button
                            variant={'outline'}
                            onClick={() => removeItem(item)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                      <div className='sm:min-w-28'>
                        <p className='text-right'>
                          {item.quantity > 1 && (
                            <>
                              {item.quantity} x
                              <ProductPrice price={item.price} plain />
                              <br />
                            </>
                          )}

                          <span className='font-bold text-lg'>
                            <ProductPrice
                              price={item.price * item.quantity}
                              plain
                            />
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className='my-3 flex flex-wrap justify-end gap-1 text-base sm:text-lg'>
                     جمع کل (
                    {items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                    کالا):
                    <span className='font-bold ml-1'>
                      <ProductPrice price={itemsPrice} plain />
                    </span>{' '}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className='rounded-xl lg:sticky lg:top-40'>
                <CardContent className='py-4 space-y-4'>
                  
                  <div className='space-y-4'>
  <div className='flex items-center justify-between border-b pb-3'>
    <span className='text-slate-600'>
      جمع سفارش ({items.reduce((acc, item) => acc + item.quantity, 0)} کالا)
    </span>
    <span className='font-bold'>
      <ProductPrice price={itemsPrice} plain />
    </span>
  </div>
                  <Button
                    onClick={() => router.push('/checkout')}
                    className='rounded-full w-full'
                  >
                    ادامه فرایند خرید
                  </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      <BrowsingHistoryList className='mt-10' />
    </div>
  )
}
