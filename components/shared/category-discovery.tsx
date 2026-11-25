import { getCatalogLandings } from '@/lib/catalog-data'
import { collectionHref } from '@/lib/catalog-landings'
import { brandLinks, CatalogLinks } from './catalog-landing'

export default async function CategoryDiscovery({ categories }: { categories: readonly string[] }) {
  const catalog = await getCatalogLandings()
  const allowed = new Set(categories)
  const links = [...catalog.subcategories.values()].filter(({ definition }) => allowed.has(definition.category))
    .map(({ definition }) => ({ label: definition.label, href: collectionHref(definition.slug) }))
  const products = [...catalog.brands.values()].flatMap(brand => brand.products)
    .filter(product => allowed.has(product.category))
  const brands = brandLinks(products, catalog)
  if (!links.length && !brands.length) return null
  return <section className='space-y-3 rounded-xl border bg-card p-4'>
    <h2 className='text-lg font-bold'>برندها و گروه‌های مرتبط</h2>
    <CatalogLinks title='زیردسته‌های مرتبط' links={links} />
    <CatalogLinks title='برندهای مرتبط' links={brands} />
  </section>
}
