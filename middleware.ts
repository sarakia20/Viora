import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { routing } from './i18n/routing'

import NextAuth from 'next-auth'
import authConfig from './auth.config'

const publicPages = [
  '/',
  '/search',
  '/sign-in',
  '/sign-up',
  '/cart',
  '/cart/(.*)',
  '/product/(.*)',
  '/category/(.*)',
  '/page/(.*)',
]

const oldLocales = ['en', 'en-US', 'fr', 'ar']

const intlMiddleware = createMiddleware(routing)

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const pathname = req.nextUrl.pathname

  // حذف زبان‌های قدیمی از ابتدای آدرس
  const oldLocale = oldLocales.find(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )

  if (oldLocale) {
    const newPathname =
      pathname.replace(new RegExp(`^/${oldLocale}`), '') || '/'

    const url = req.nextUrl.clone()
    url.pathname = newPathname

    return NextResponse.redirect(url)
  }

  const publicPathnameRegex = RegExp(
    `^(${publicPages
      .flatMap((page) => (page === '/' ? ['', '/'] : page))
      .join('|')})/?$`,
    'i'
  )

  const isPublicPage = publicPathnameRegex.test(pathname)

  if (isPublicPage) {
    return intlMiddleware(req)
  }

  if (!req.auth) {
    const signInUrl = new URL('/sign-in', req.url)

    signInUrl.searchParams.set(
      'callbackUrl',
      `${pathname}${req.nextUrl.search}`
    )

    return NextResponse.redirect(signInUrl)
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
