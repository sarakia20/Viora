import type { Metadata } from 'next'
import { getAbsoluteUrl } from './site-url'

const DEFAULT_SOCIAL_IMAGE = '/images/banner-kitchen.webp'

export function publicMetadata({
  title, description, path, images = [DEFAULT_SOCIAL_IMAGE], index = true,
}: {
  title: string
  description: string
  path: string
  images?: string[]
  index?: boolean
}): Metadata {
  const canonical = getAbsoluteUrl(path)
  const socialImages = images.map(getAbsoluteUrl)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: { index, follow: true },
    openGraph: {
      title, description, url: canonical, siteName: 'ویورا', type: 'website',
      locale: 'fa_IR', images: socialImages,
    },
    twitter: { card: 'summary_large_image', title, description, images: socialImages },
  }
}

export type QueryParams = Record<string, string | string[] | undefined>

export function parsePage(value: QueryParams[string]) {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null
  const page = Number(value)
  return Number.isSafeInteger(page) && page >= 1 ? page : null
}

export function isTrackingParam(key: string) {
  return /^utm_/i.test(key) || /^(?:gclid|dclid|fbclid|msclkid|gbraid|wbraid)$/i.test(key)
}

export function pageHref(path: string, page: number, query = new URLSearchParams()) {
  const params = new URLSearchParams(query)
  params.delete('page')
  if (page > 1) params.set('page', String(page))
  return params.size ? `${path}?${params}` : path
}

export function normalizedPageHref(path: string, page: number, query: QueryParams) {
  if (query.page === undefined || (page > 1 && query.page === String(page))) return null
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (key === 'page' || value === undefined) continue
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, item)
  }
  return pageHref(path, page, params)
}
