import { unstable_cache } from 'next/cache'
import { connectToDatabase } from '@/lib/db'
import Setting from '@/lib/db/models/setting.model'
import { getAbsoluteUrl, SITE_URL } from '@/lib/site-url'
import { STORE_ADDRESS, STORE_ALTERNATE_NAME, STORE_NAME, STORE_PHONE, STORE_SOCIAL } from '@/lib/store-brand'

type StoreSite = { logo?: string }

// Read only persisted settings: getSetting() can fall back to demonstration data.
const getPersistedSite = unstable_cache(async () => {
  await connectToDatabase()
  const setting = await Setting.findOne().select('site.logo -_id')
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
        '@type': 'Organization', '@id': `${SITE_URL}/#organization`,
        name: STORE_NAME, alternateName: STORE_ALTERNATE_NAME, url: SITE_URL,
        ...(logo ? { logo } : {}),
        telephone: STORE_PHONE,
        address: STORE_ADDRESS,
        sameAs: Object.values(STORE_SOCIAL),
      },
      {
        '@type': 'WebSite', '@id': `${SITE_URL}/#website`,
        name: STORE_NAME, alternateName: STORE_ALTERNATE_NAME, url: SITE_URL,
        inLanguage: 'fa-IR', publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  }
}

export async function getStoreJsonLd() {
  if (process.env.SKIP_DB === 'true') return buildStoreJsonLd()
  try {
    return buildStoreJsonLd(await getPersistedSite())
  } catch {
    console.error('Unable to load optional store schema settings')
    return buildStoreJsonLd()
  }
}
