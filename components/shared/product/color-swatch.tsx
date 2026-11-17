const colors: Record<string, string> = {
  'سفید': '#fff', 'مشکی': '#171717', 'طوسی': '#9ca3af', 'خاکستری': '#9ca3af',
  'کروم': '#cbd5e1', 'استیل': '#b8bec5', 'تیتانیوم': '#4b5563',
  'طلایی': '#d4af37', 'طلا مات': '#c9a227', 'طلای مات': '#c9a227',
  'طلایی مات': '#c9a227', 'قرمز': '#b91c1c', 'آبی': '#2563eb',
  'سبز': '#15803d', 'کرم': '#e7d8b7', 'نقره ای': '#c0c0c0',
  'اقیانوسی': '#007a8a', 'مرجانی': '#ff7f50',
  'white': '#fff', 'black': '#171717', 'red': '#b91c1c',
  'طلامات': '#c9a227', 'طلایی براق': '#d4af37', 'طلا': '#d4af37',
  'سفید مات': '#fff', 'مشکی مات': '#171717', 'کروم مات': '#cbd5e1',
  'نقره': '#c0c0c0', 'نقره‌ای': '#c0c0c0',
  'gold': '#d4af37', 'chrome': '#cbd5e1', 'silver': '#c0c0c0',
  'gray': '#9ca3af', 'grey': '#9ca3af', 'blue': '#2563eb', 'green': '#15803d',
}

function normalizeColorName(name: string) {
  return name.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ')
    .replace(/[+/،,-]/g, ' ').replace(/\s+و\s+/g, ' ')
    .replace(/\s+/g, ' ').trim().toLowerCase()
}

const normalizedColors: Record<string, string> = Object.fromEntries(
  Object.entries(colors).map(([name, color]) => [normalizeColorName(name), color])
)
const colorNames = Object.keys(normalizedColors)
  .sort((a, b) => b.length - a.length)

const compoundColors: Record<string, string[]> = {
  'مشکی کلید طلایی': ['#171717', '#d4af37'],
  'مشکی کلید کروم': ['#171717', '#cbd5e1'],
}

export const colorOptionsClassName = 'flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain scroll-smooth p-1'

export function getSwatchColors(name: string): string[] | undefined {
  let remaining = normalizeColorName(name)
  if (!remaining) return undefined
  if (Object.hasOwn(compoundColors, remaining)) return compoundColors[remaining]
  const result: string[] = []
  while (remaining) {
    const match = colorNames.find((color) => remaining === color || remaining.startsWith(`${color} `))
    if (!match) return undefined // Do not infer a color from a partially recognized finish.
    result.push(normalizedColors[match])
    remaining = remaining.slice(match.length).trim()
  }
  return result
}

export function colorOptionClassName(selected: boolean) {
  return 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 p-1 focus-visible:outline-slate-800 ' +
    (selected ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-200 ring-offset-2' :
      'border-slate-200 bg-white hover:border-slate-500')
}

export default function ColorSwatch({ name }: { name: string }) {
  const palette = getSwatchColors(name)
  const style = palette?.length === 1 ? { backgroundColor: palette[0] } : palette ? {
    background: `linear-gradient(135deg, ${palette.map((color, index) =>
      `${color} ${index * 100 / palette.length}% ${(index + 1) * 100 / palette.length}%`).join(', ')})`,
  } : { backgroundColor: '#e2e8f0' }
  return (
    <span aria-hidden='true' className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/15 bg-slate-100 text-xs text-slate-500' style={style} />
  )
}
