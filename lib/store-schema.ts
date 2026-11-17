import { unstable_cache } from 'next/cache'
import { connectToDatabase } from '@/lib/db'
import Setting from '@/lib/db/models/setting.model'
import { getAbsoluteUrl, SITE_URL } from '@/lib/site-url'

type StoreSite = { logo?: string; phone?: string; email?: string; address?: string }

// Read only persisted settings: getSetting() can fall back to demonstration data.
const getPersistedSite = unstable_cache(async () => {
  await connectToDatabase()
  const setting = await Setting.findOne().select('site.logo site.phone site.email site.address -_id')
    .lean<{ site?: StoreSite }>()
  return setting?.site ?? null
}, ['store-schema-settings-v1'], { revalidate: 3600 })

export function buildStoreJsonLd(site?: StoreSite | null) {
  let logo: string | undefined
  if (site?.logo?.trim()) {
    try {
      const candidate = new URL(getAbsoluteUrl(site.logo.trim()))
      if (['http:', 'https:'].includes(candidate.protocol)) logo = candidate.toString()
    } catch { /* Omit malformed configuration rather than invent a logo. */ }
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'ویورا', url: SITE_URL,
        ...(logo ? { logo } : {}),
        ...(site?.phone?.trim() ? { telephone: site.phone.trim() } : {}),
        ...(site?.email?.trim() ? { email: site.email.trim() } : {}),
        ...(site?.address?.trim() ? { address: site.address.trim() } : {}),
      },
      {
        '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'ویورا', url: SITE_URL,
        inLanguage: 'fa-IR', publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  }
}

export async function getStoreJsonLd() {
  // No sample contacts or addresses in local design mode.
  if (process.env.SKIP_DB === 'true') return buildStoreJsonLd()
  try {
    return buildStoreJsonLd(await getPersistedSite())
  } catch {
    console.error('Unable to load optional store schema settings')
    return buildStoreJsonLd()
  }
}
