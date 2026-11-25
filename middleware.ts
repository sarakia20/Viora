import createMiddleware from 'next-intl/middleware'
import NextAuth from 'next-auth'
import type { NextFetchEvent, NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import authConfig, { isPrivatePath } from './auth.config'
import { routing } from './i18n/routing'
import { getCategoryConfig } from './lib/category-config'

const intl = createMiddleware(routing)
const publicPath = /^(?:\/|\/(?:search|sign-in|sign-up)|\/cart(?:\/[^/]+)?|\/(?:product|category|page)\/[^/]+)\/?$/
const legacyLocale = /^\/(?:fa|en|en-US|fr|ar)(?=\/|$)/
const protect = NextAuth({ ...authConfig, callbacks: {} }).auth((request, _event: NextFetchEvent) => {
  if (request.auth) return intl(request)
  const signIn = new URL('/sign-in', request.url)
  signIn.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(signIn)
})

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const url = request.nextUrl.clone()
  const originalPath = url.pathname
  const stripped = originalPath.replace(legacyLocale, '') || '/'
  const categoryMatch = /^\/category\/([^/]+)$/.exec(stripped)
  const knownCategory = !categoryMatch || Boolean(getCategoryConfig(categoryMatch[1]))
  if ((publicPath.test(stripped) && knownCategory) || isPrivatePath(stripped)) {
    url.pathname = stripped
  }
  const paginated = url.pathname === '/search' ||
    (url.pathname === stripped && Boolean(categoryMatch) && knownCategory)
  const pages = url.searchParams.getAll('page')
  if (paginated && pages.length === 1 && /^\d+$/.test(pages[0])) {
    const page = Number(pages[0])
    if (page === 1) url.searchParams.delete('page')
  }
  if (url.pathname !== originalPath || url.search !== request.nextUrl.search) {
    return NextResponse.redirect(url, 308)
  }

  if (isPrivatePath(originalPath)) return protect(request, event)
  if (legacyLocale.test(originalPath)) return NextResponse.next()
  return intl(request)
}

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)',
    '/product/:slug', '/category/:slug', '/page/:slug',
    '/account/:path*', '/admin/:path*', '/checkout/:path*',
    '/:locale(fa|en|en-US|fr|ar)/:section(product|category|page|account|admin|checkout)/:path*',
  ],
}
