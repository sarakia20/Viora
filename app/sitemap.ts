import type { MetadataRoute } from 'next'

import { readPublishedCatalog } from '@/lib/catalog-data'
import { brandHref, buildCatalogLandings, collectionHref, getExactCollection } from '@/lib/catalog-landings'
import { categoryConfig, getCategoryLandingPath, type CategoryConfig } from '@/lib/category-config'
import { pageHref } from '@/lib/public-seo'
import { getAbsoluteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await readPublishedCatalog()
  const { brands, subcategories, selected } = buildCatalogLandings(products)
  const categories = new Set(products.map((product) => product.category))
  const paths = new Set(['/', '/page/about-us'])
  const landings: CategoryConfig[] = Object.values(categoryConfig)
  for (const category of landings) {
    if ((category.productCategories ?? [category.productCategory]).some((name) => categories.has(name))) {
      paths.add('/category/' + category.slug)
    }
  }
  for (const slug of brands.keys()) paths.add(brandHref(slug))
  for (const slug of subcategories.keys()) paths.add(collectionHref(slug))
  for (const { configuration } of selected) {
    paths.add(brandHref(configuration.brand) + '/' + configuration.collection)
  }
  for (const { slug, category, subCategory } of products) {
    // updatedAt includes operational mutations such as stock and sales counters.
    if (slug?.trim() && slug !== '.' && slug !== '..') paths.add('/product/' + encodeURIComponent(slug))
    if (!category?.trim() || category === 'all') continue
    const selection = new URLSearchParams({ category })
    if (!getCategoryLandingPath(category)) paths.add(pageHref('/search', 1, selection))
    if (subCategory?.trim() && subCategory !== 'all' && !getExactCollection(category, subCategory)) {
      selection.set('subCategory', subCategory)
      paths.add(pageHref('/search', 1, selection))
    }
  }
  return [...paths].map((path) => ({ url: getAbsoluteUrl(path) }))
}
