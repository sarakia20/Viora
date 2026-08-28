import type { MetadataRoute } from 'next'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { categoryConfig } from '@/lib/category-config'
import { getAbsoluteUrl } from '@/lib/site-url'

export const revalidate = 3600

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
    await connectToDatabase()

    const products = await Product.find({ isPublished: true })
      .select('slug updatedAt')
      .lean<Array<{ slug: string; updatedAt?: Date }>>()

    productRoutes = products.map((product) => ({
      url: getAbsoluteUrl(`/product/${product.slug}`),
      ...(product.updatedAt ? { lastModified: product.updatedAt } : {}),
    }))
  } catch (error) {
    console.error('Failed to load products for sitemap:', error)
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
