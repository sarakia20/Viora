import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fa'],
  defaultLocale: 'fa',
  localePrefix: 'never',
  pathnames: {},
})

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
