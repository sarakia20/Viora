import { Check } from 'lucide-react'
import { getProductHighlights } from '@/lib/product-highlights'

export default function ProductHighlights({
  description,
  showDivider = true,
}: {
  description?: string
  showDivider?: boolean
}) {
  const features = getProductHighlights(description)
  if (!features.length) return null

  return (
    <section
      dir='rtl'
      aria-labelledby='product-highlights-heading'
      className={showDivider ? 'min-w-0 border-t border-slate-200 pt-4' : 'min-w-0'}
    >
      <h2 id='product-highlights-heading' className='mb-3 text-sm font-bold text-slate-900'>
        ویژگی‌های برجسته محصول
      </h2>
      <ul className='space-y-2 text-sm leading-6 text-slate-700'>
        {features.map((feature) => (
          <li key={feature} className='flex items-start gap-2 break-words'>
            <Check aria-hidden='true' className='mt-1 size-4 shrink-0 text-emerald-700' />
            <span className='min-w-0'>{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
