const separators = '[\\s\u00a0\u1680\u2000-\u200d\u2028\u2029\u202f\u205f\u3000\ufeff]*'
const spacing = /[\s\u200b-\u200d]/gu
const equivalentLetters: Record<string, string> = {
  ی: '[یيى]',
  ي: '[یيى]',
  ى: '[یيى]',
  ک: '[کك]',
  ك: '[کك]',
}

export function productSearchPattern(query: unknown) {
  const input = Array.isArray(query) ? query[0] : query
  if (typeof input !== 'string') return ''
  if (input.length > 4096 || input.includes('\0')) return '(?!)'
  const trimmed = input.trim()
  if (trimmed === 'all') return ''

  const letters = Array.from(trimmed.replace(spacing, ''))
  if (letters.length > 128) return '(?!)'

  return letters.map((letter) =>
    Object.hasOwn(equivalentLetters, letter)
      ? equivalentLetters[letter]
      : letter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join(separators)
}
