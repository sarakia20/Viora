/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Button } from '@/components/ui/button'
import useCartStore from '@/hooks/use-cart-store'
import { useToast } from '@/hooks/use-toast'
import { OrderItem } from '@/types'
import { Minus, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AddToCart({
  item,
  minimal = false,
}: {
  item: OrderItem
  minimal?: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()
  const { addItem } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const t = useTranslations()

  const increaseQuantity = () => {
    if (quantity < item.countInStock) setQuantity(quantity + 1)
  }

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  return minimal ? (
    <Button
      className='rounded-full w-auto bg-slate-900 text-white hover:bg-slate-800'
      onClick={() => {
        try {
          addItem(item, 1)
          toast({
            description: t('Product.Added to Cart'),
            action: (
              <Button onClick={() => router.push('/cart')}>
                {t('Product.Go to Cart')}
              </Button>
            ),
          })
        } catch (error: any) {
          toast({
            variant: 'destructive',
            description: error.message,
          })
        }
      }}
    >
      {t('Product.Add to Cart')}
    </Button>
  ) : (
    <div className='w-full space-y-3'>
      <div className='flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2'>
        <span className='text-sm font-medium text-slate-700'>تعداد</span>

        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={increaseQuantity}
            disabled={quantity >= item.countInStock}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm border border-slate-200 disabled:opacity-40'
          >
            <Plus className='h-4 w-4' />
          </button>

          <span className='min-w-5 text-center font-bold'>{quantity}</span>

          <button
            type='button'
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm border border-slate-200 disabled:opacity-40'
          >
            <Minus className='h-4 w-4' />
          </button>
        </div>
      </div>

      <Button
        className='rounded-full w-full bg-slate-900 text-white hover:bg-slate-800'
        type='button'
        onClick={async () => {
          try {
            const itemId = await addItem(item, quantity)
            router.push(`/cart/${itemId}`)
          } catch (error: any) {
            toast({
              variant: 'destructive',
              description: error.message,
            })
          }
        }}
      >
        {t('Product.Add to Cart')}
      </Button>

      <Button
        variant='secondary'
        onClick={() => {
          try {
            addItem(item, quantity)
            router.push(`/checkout`)
          } catch (error: any) {
            toast({
              variant: 'destructive',
              description: error.message,
            })
          }
        }}
        className='w-full rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200'
      >
        {t('Product.Buy Now')}
      </Button>
    </div>
  )
}