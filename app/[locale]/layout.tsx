import type { CSSProperties } from 'react'
import { Geist, Vazirmatn } from 'next/font/google'
import '../globals.css'
import ClientProviders from '@/components/shared/client-providers'
import { getDirection } from '@/i18n-config'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { getSetting } from '@/lib/actions/setting.actions'
import { cookies } from 'next/headers'
import { SITE_ORIGIN } from '@/lib/site-url'
import { getStoreJsonLd } from '@/lib/store-schema'
import { STORE_NAME } from '@/lib/store-brand'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

// ✅ Persian/Arabic-friendly font (fixes ugly/too-small numerals in fa/rtl)
const vazir = Vazirmatn({
  variable: '--font-vazir',
  subsets: ['arabic'],
})

export async function generateMetadata() {
  const {
    site: { slogan, description },
  } = await getSetting()
  return {
    title: {
      template: `%s | ${STORE_NAME}`,
      default: `${STORE_NAME}. ${slogan}`,
    },
    description: description,
    metadataBase: SITE_ORIGIN,
    openGraph: { siteName: STORE_NAME, locale: 'fa_IR' },
    icons: {
      icon: { url: '/icon.png', type: 'image/png', sizes: '96x96' },
    },
  }
}

export default async function AppLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>
  children: React.ReactNode
}) {
  const [{ locale }, cookieStore] = await Promise.all([params, cookies()])
  const currency = cookieStore.get('currency')?.value ?? 'USD'

  // Ensure that the incoming `locale` is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const [setting, messages, storeJsonLd] = await Promise.all([
    getSetting(), getMessages(), getStoreJsonLd(),
  ])

  return (
    <html
      lang={locale}
      dir={getDirection(locale) === 'rtl' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <head>
        <meta name="enamad" content="14560157" /> 
      </head>
      <body
        style={{ '--font-vazir-primary': vazir.style.fontFamily.split(',')[0] } as CSSProperties}
        className={`min-h-screen ${geistSans.variable} ${vazir.variable} antialiased`}
      >
        <script type='application/ld+json' dangerouslySetInnerHTML={{
          __html: JSON.stringify(storeJsonLd).replace(/</g, '\\u003c'),
        }} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientProviders setting={{ ...setting, currency }}>
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
