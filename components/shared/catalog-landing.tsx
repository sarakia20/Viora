import { cache } from 'react'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import Pagination from '@/components/shared/pagination'
import ProductCard from '@/components/shared/product/product-card'
import { getAllProducts } from '@/lib/actions/product.actions'
import { getCatalogLandings } from '@/lib/catalog-data'
import { brandGuides, brandHref, categoryHref, collectionHref, getBrandSlug, type CatalogProduct } from '@/lib/catalog-landings'
import { isTrackingParam, normalizedPageHref, pageHref, parsePage, publicMetadata, type QueryParams } from '@/lib/public-seo'
import { getProductPath } from '@/lib/product-seo'
import { getAbsoluteUrl } from '@/lib/site-url'

type CatalogLink = { label: string; href: string }
type Landing = {
  title: string
  description: string
  guide: string
  path: string
  products: CatalogProduct[]
  parents: CatalogLink[]
  related: CatalogLink[]
  filter?: boolean
}

export function categoryLinks(products: CatalogProduct[]) {
  return [...new Set(products.map(product => product.category).filter(category => category && category !== 'all'))]
    .sort((a, b) => a.localeCompare(b, 'fa')).map(category => ({ label: category, href: categoryHref(category) }))
}

export function brandLinks(products: CatalogProduct[], catalog: Awaited<ReturnType<typeof getCatalogLandings>>) {
  const slugs = new Set(products.map(product => getBrandSlug(product.brand)))
  return [...catalog.brands].filter(([slug]) => slugs.has(slug))
    .map(([slug, brand]) => ({ label: brand.label, href: brandHref(slug) }))
}

export function uniqueCatalogLinks(links: CatalogLink[]) {
  return [...new Map(links.map(link => [link.href, link])).values()]
}

export function CatalogLinks({ title, links }: { title: string; links: CatalogLink[] }) {
  const unique = uniqueCatalogLinks(links)
  if (!unique.length) return null
  return <nav aria-label={title} className='flex flex-wrap gap-x-5 gap-y-2 text-sm'>
    {unique.map(link => <Link key={link.href} href={link.href} className='hover:underline'>{link.label}</Link>)}
  </nav>
}

async function getLanding(kind: 'brand' | 'subcategory', slug: string, collection?: string): Promise<Landing> {
  const catalog = await getCatalogLandings()
  if (kind === 'subcategory') {
    const entry = catalog.subcategories.get(slug)
    if (!entry) notFound()
    const { definition, products } = entry
    return {
      ...definition, title: definition.label, path: collectionHref(slug), products,
      parents: [{ label: definition.category, href: categoryHref(definition.category) }],
      related: [
        ...brandLinks(products, catalog),
        ...catalog.selected.filter(item => item.configuration.collection === slug)
          .map(({ configuration, brand }) => ({ label: definition.label + ' ' + brand.label, href: brandHref(configuration.brand) + '/' + slug })),
      ],
    }
  }

  const brand = catalog.brands.get(slug)
  if (!brand) notFound()
  if (collection) {
    const entry = catalog.selected.find(item => item.configuration.brand === slug && item.configuration.collection === collection)
    if (!entry) notFound()
    const label = entry.subcategory.definition.label
    return {
      ...entry.configuration, title: label + ' ' + brand.label, products: entry.products,
      path: brandHref(slug) + '/' + collection, parents: [{ label: brand.label, href: brandHref(slug) }],
      related: [{ label, href: collectionHref(collection) }, ...categoryLinks(entry.products)],
    }
  }
  const related = categoryLinks(brand.products)
  const topics = related.map(link => link.label).slice(0, 3).join('، ')
  return {
    title: 'محصولات ' + brand.label, path: brandHref(slug), products: brand.products, parents: [], filter: true,
    description: topics
      ? `مدل‌های ثبت‌شده برند ${brand.label} در گروه‌های ${topics} را از نظر مشخصات و قیمت در ویورا مقایسه کنید.`
      : `مدل‌ها، مشخصات و وضعیت موجودی محصولات برند ${brand.label} را در ویورا بررسی کنید.`,
    guide: (Object.hasOwn(brandGuides, slug) ? brandGuides[slug] : undefined) ?? `برای انتخاب از کاتالوگ ${brand.label}، ابتدا گروه محصول را مشخص کنید. سپس ابعاد نصب، گزینه‌های قابل سفارش و اقلام همراه را در صفحه همان مدل بررسی کنید.`,
    related: [
      ...related,
      ...catalog.selected.filter(item => item.configuration.brand === slug).map(({ configuration, subcategory }) =>
        ({ label: subcategory.definition.label + ' ' + brand.label, href: brandHref(slug) + '/' + configuration.collection })),
    ],
  }
}

export const getCatalogPage = cache(async (
  kind: 'brand' | 'subcategory', slug: string, collection: string | undefined, key: string,
) => {
  const landing = await getLanding(kind, slug, collection)
  const query: QueryParams = JSON.parse(key)
  const page = parsePage(query.page)
  if (page === null) notFound()
  const category = query.category
  const facets = landing.filter ? categoryLinks(landing.products) : []
  if (category !== undefined && (typeof category !== 'string' || !facets.some(link => link.label === category))) notFound()
  const normalized = normalizedPageHref(landing.path, page, query)
  const products = category ? landing.products.filter(product => product.category === category) : landing.products
  const data = await getAllProducts({
    slugs: products.map(product => product.slug),
    query: 'all', category: 'all', tag: 'all', sort: 'best-selling', page,
  })
  if (!data.totalProducts || page > data.totalPages) notFound()
  if (normalized) permanentRedirect(normalized)
  const filtered = Object.keys(query).some(key => key !== 'page' && !isTrackingParam(key))
  const canonical = pageHref(landing.path, filtered ? 1 : page)
  const paginationQuery = typeof category === 'string' ? new URLSearchParams({ category }).toString() : ''
  return { landing, data, page, facets, category, canonical, filtered, paginationQuery }
})

type Page = Awaited<ReturnType<typeof getCatalogPage>>

export function catalogMetadata({ landing, page, canonical, filtered }: Page) {
  return publicMetadata({
    title: `خرید ${landing.title}${page > 1 ? ' - صفحه ' + page : ''} | ویورا`,
    description: landing.description, path: canonical, index: !filtered,
  })
}

export function CatalogLanding({ result }: { result: Page }) {
  const { landing, data, page, facets, category, paginationQuery, canonical } = result
  const breadcrumbs = [{ label: 'خانه', href: '/' }, ...landing.parents, { label: landing.title, href: canonical }]
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map(({ label, href }, index) =>
          ({ '@type': 'ListItem', position: index + 1, name: label, item: getAbsoluteUrl(href) })),
      },
      {
        '@type': 'CollectionPage', url: getAbsoluteUrl(canonical), name: landing.title,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: data.products.map((product, index) => ({
            '@type': 'ListItem', position: data.from + index,
            url: getAbsoluteUrl(getProductPath(product.slug)),
          })),
        },
      },
    ],
  }
  return <div className='min-w-0 space-y-6'>
    <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <nav aria-label='مسیر راهنما' className='flex flex-wrap gap-2 text-sm text-muted-foreground'>
      {breadcrumbs.map(({ label, href }, index) => <span key={href} className='inline-flex gap-2'>
        {index > 0 && <span aria-hidden='true'>/</span>}
        {index === breadcrumbs.length - 1 ? <span aria-current='page'>{label}</span> : <Link href={href}>{label}</Link>}
      </span>)}
    </nav>
    <header className='rounded-lg border bg-card p-4 sm:p-6'>
      <h1 className='text-xl font-bold sm:text-2xl'>{landing.title}</h1>
      <p className='mt-2 text-sm leading-7 text-muted-foreground'>{landing.description}</p>
    </header>
    {facets.length > 0 && <nav aria-label='دسته‌های این برند' className='flex flex-wrap gap-2 text-sm'>
      {[{ label: 'همه محصولات', href: landing.path }, ...facets.map(({ label }) => ({
        label, href: landing.path + '?' + new URLSearchParams({ category: label }),
      }))].map(({ label, href }, index) => (
        <Link key={href} href={href} aria-current={(index === 0 ? !category : label === category) ? 'page' : undefined}
          className='rounded-lg border px-3 py-2 hover:bg-muted aria-[current=page]:bg-muted'>{label}</Link>
      ))}
    </nav>}
    <section aria-labelledby='catalog-products' className='space-y-4'>
      <h2 id='catalog-products' className='text-lg font-bold'>محصولات <span className='text-sm font-normal text-muted-foreground'>({data.totalProducts})</span></h2>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {data.products.map((product, index) =>
          <ProductCard key={product.slug} product={product} priorityImage={index === 0} />)}
      </div>
      {data.totalPages > 1 && <Pagination path={landing.path} query={paginationQuery} page={page} totalPages={data.totalPages} />}
    </section>
    {page === 1 && <section className='space-y-3 rounded-lg border bg-card p-4 sm:p-6'>
      <h2 className='text-lg font-bold'>راهنمای انتخاب</h2>
      <p className='text-sm leading-7 text-muted-foreground'>{landing.guide}</p>
      <CatalogLinks title='دسته‌ها و برندهای مرتبط' links={landing.related} />
    </section>}
  </div>
}
