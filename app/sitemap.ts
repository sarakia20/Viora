import type { MetadataRoute } from 'next'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { categoryConfig } from '@/lib/category-config'

const SITE_URL = 'https://viora-store.ir'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/search',
    '/page/about-us',
  ].map((route) => ({ url: `${SITE_URL}${route}` }))

  const categoryRoutes: MetadataRoute.Sitemap = Object.values(
    categoryConfig
  ).map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
  }))

  await connectToDatabase()

  const products = await Product.find({ isPublished: true })
    .select('slug updatedAt')
    .lean<Array<{ slug: string; updatedAt?: Date }>>()

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    ...(product.updatedAt ? { lastModified: product.updatedAt } : {}),
  }))

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
