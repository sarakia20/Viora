import { SITE_ORIGIN } from './site-url'

export function signInCallback(value: unknown) {
  if (typeof value !== 'string') return '/'
  try {
    const url = new URL(value, SITE_ORIGIN)
    if (url.origin !== SITE_ORIGIN.origin || url.pathname.startsWith('//') ||
        /^\/(?:[^/]+\/)?sign-(?:in|up)\/?$/.test(url.pathname)) return '/'
    return url.pathname + url.search + url.hash
  } catch {
    return '/'
  }
}
