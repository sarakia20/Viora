const colors: Record<string, string> = {
  'سفید': '#fff', 'مشکی': '#171717', 'طوسی': '#9ca3af', 'خاکستری': '#9ca3af',
  'کروم': '#cbd5e1', 'استیل': '#b8bec5', 'تیتانیوم': '#6b7280',
  'طلایی': '#d4af37', 'طلا مات': '#c9a227', 'طلای مات': '#c9a227',
  'طلایی مات': '#c9a227', 'قرمز': '#b91c1c', 'آبی': '#2563eb',
  'سبز': '#15803d', 'کرم': '#e7d8b7', 'نقره ای': '#c0c0c0',
  'white': '#fff', 'black': '#171717', 'red': '#b91c1c',
}

export default function ColorSwatch({ name, image }: { name: string; image?: string }) {
  const normalized = name.replace(/‌/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  const color = colors[normalized]
  // Pattern names and unknown finishes use the actual product photo, never an invented texture.
  return color ? (
    <span aria-hidden='true' className='block h-6 w-6 rounded-full border border-black/15' style={{ backgroundColor: color }} />
  ) : image ? (
    // A small crop of the actual variant identifies decorative finishes.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt='' className='h-7 w-7 rounded-full border border-slate-200 object-cover' />
  ) : (
    <span className='px-1 text-xs font-medium'>{name}</span>
  )
}
