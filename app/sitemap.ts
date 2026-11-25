import type { MetadataRoute } from 'next'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import data from '@/lib/data'
import { categoryConfig, getCategoryLandingPath, type CategoryConfig } from '@/lib/category-config'
import { pageHref } from '@/lib/public-seo'
import { getAbsoluteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

type SitemapProduct = { slug: string; category: string; subCategory?: string }

async function readPublishedProducts(): Promise<SitemapProduct[]> {
  if (process.env.SKIP_DB === 'true') return data.products.filter((product) => product.isPublished)
  await connectToDatabase()
  // Direct database edits must appear too. A projection keeps this uncached read small.
  return Product.find({ isPublished: true })
    .select({ _id: 0, slug: 1, category: 1, subCategory: 1 })
    .lean<SitemapProduct[]>()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await readPublishedProducts()
  const categories = new Set(products.map((product) => product.category))
  const paths = new Set(['/', '/page/about-us'])
  const landings: CategoryConfig[] = Object.values(categoryConfig)
  for (const category of landings) {
    if ((category.productCategories ?? [category.productCategory]).some((name) => categories.has(name))) {
      paths.add('/category/' + category.slug)
    }
  }
  for (const { slug, category, subCategory } of products) {
    // updatedAt includes operational mutations such as stock and sales counters.
    if (slug?.trim() && slug !== '.' && slug !== '..') paths.add('/product/' + encodeURIComponent(slug))
    if (!category?.trim() || category === 'all') continue
    const selection = new URLSearchParams({ category })
    if (!getCategoryLandingPath(category)) paths.add(pageHref('/search', 1, selection))
    if (subCategory?.trim() && subCategory !== 'all') {
      selection.set('subCategory', subCategory)
      paths.add(pageHref('/search', 1, selection))
    }
  }
  return [...paths].map((path) => ({ url: getAbsoluteUrl(path) }))
}
