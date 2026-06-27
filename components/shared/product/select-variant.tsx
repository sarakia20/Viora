import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import Link from 'next/link'

const colorMap: Record<string, string> = {
  مشکی: '#111827',
  سفید: '#ffffff',
  طوسی: '#9ca3af',
  تیتانیوم: '#6b7280',
  طلایی: '#d4af37',
  طلامات: '#c9a227',
  بامبو: '#c8a66a',
  خورشید: '#f59e0b',
  'مشکی طلایی': '#111827',
}

export default function SelectVariant({
  product,
  size,
  color,
}: {
  product: IProduct
  color: string
  size: string
}) {
  const selectedColor = color || product.colors[0]
  const selectedSize = size || product.sizes[0]

  return (
    <>
      {product.colors.length > 0 && (
        <div className='space-y-2'>
          <div className='font-medium'>رنگ:</div>

          <div className='flex flex-wrap gap-2'>
            {product.colors.map((x: string) => (
              <Button
                asChild
                variant='outline'
                className={
                  selectedColor === x
                    ? 'border-2 border-slate-900 bg-slate-50 rounded-xl px-4'
                    : 'border-2 border-slate-200 rounded-xl px-4'
                }
                key={x}
              >
                <Link
                  replace
                  scroll={false}
                  href={`?${new URLSearchParams({
                    color: x,
                    size: selectedSize,
                  })}`}
                >
                  <span
                    className='h-4 w-4 rounded-full border border-slate-300'
                    style={{ backgroundColor: colorMap[x] || '#e5e7eb' }}
                  />
                  <span>{x}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {product.sizes.length > 0 && (
        <div className='mt-4 space-y-2'>
          <div className='font-medium'>سایز:</div>

          <div className='flex flex-wrap gap-2'>
            {product.sizes.map((x: string) => (
              <Button
                asChild
                variant='outline'
                className={
                  selectedSize === x
                    ? 'border-2 border-slate-900 bg-slate-50 rounded-xl'
                    : 'border-2 border-slate-200 rounded-xl'
                }
                key={x}
              >
                <Link
                  replace
                  scroll={false}
                  href={`?${new URLSearchParams({
                    color: selectedColor,
                    size: x,
                  })}`}
                >
                  {x}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}