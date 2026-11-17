import ColorSwatch from './color-swatch'
import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import Link from 'next/link'

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
          <div className='text-sm text-slate-500'>رنگ: <span className='font-semibold text-slate-900'>{selectedColor}</span></div>

          <div className='flex flex-wrap gap-2'>
            {product.colors.map((x: string) => (
              <Button
                asChild
                variant='outline'
                className={
                  selectedColor === x
                    ? 'h-11 min-w-11 border-2 border-slate-800 bg-slate-50 rounded-full p-1 ring-2 ring-slate-200 ring-offset-2'
                    : 'h-11 min-w-11 border-2 border-slate-200 rounded-full p-1'
                }
                key={x}
              >
                <Link
                  title={x}
                  aria-label={x}
                  aria-current={selectedColor === x ? 'true' : undefined}
                  replace
                  scroll={false}
                  href={`?${new URLSearchParams({
                    color: x,
                    size: selectedSize,
                  })}`}
                >
                  <ColorSwatch name={x} />
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
