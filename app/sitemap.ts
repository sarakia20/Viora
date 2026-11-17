import type { MetadataRoute } from 'next'
import { unstable_cache } from 'next/cache'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { categoryConfig } from '@/lib/category-config'
import { getAbsoluteUrl } from '@/lib/site-url'

// Read at runtime: database access may be unavailable during the image build.
export const dynamic = 'force-dynamic'

// Cache successful queries, not a fallback sitemap with missing products.
const getPublishedProducts = unstable_cache(
  async () => {
    await connectToDatabase()
    return Product.find({ isPublished: true })
      .select({ _id: 0, slug: 1, updatedAt: 1 })
      .lean<Array<{ slug: string; updatedAt?: Date }>>()
  },
  ['sitemap-published-products-v1'],
  { revalidate: 3600 }
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/page/about-us',
  ].map((route) => ({ url: getAbsoluteUrl(route || '/') }))

  const categoryRoutes: MetadataRoute.Sitemap = Object.values(
    categoryConfig
  ).map((category) => ({
    url: getAbsoluteUrl(`/category/${category.slug}`),
  }))

  let productRoutes: MetadataRoute.Sitemap = []

  try {
    const products = await getPublishedProducts()

    productRoutes = products.map((product) => ({
      url: getAbsoluteUrl(`/product/${encodeURIComponent(product.slug)}`),
      ...(product.updatedAt ? { lastModified: product.updatedAt } : {}),
    }))
  } catch (error) {
    // Do not log connection details or return a successful partial sitemap.
    throw new Error('Failed to load published products for sitemap', { cause: error })
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
