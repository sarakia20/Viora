export const SITE_URL = 'https://viora-store.ir'

export const SITE_ORIGIN = new URL(SITE_URL)

export function getAbsoluteUrl(path: string) {
  return new URL(path, SITE_ORIGIN).toString()
}
