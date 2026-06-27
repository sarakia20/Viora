export function formatCurrency(amount: number, locale: string) {
  const currencyMap: Record<string, string> = {
    'en-US': 'USD',
    fr: 'EUR',
    ar: 'SAR',
    fa: 'IRR',
  }

  const currency = currencyMap[locale] || 'USD'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}