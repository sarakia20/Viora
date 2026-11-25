import { cache } from 'react'
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import data from '@/lib/data'
import { buildCatalogLandings, type CatalogProduct } from './catalog-landings'

export async function readPublishedCatalog(): Promise<CatalogProduct[]> {
  if (process.env.SKIP_DB === 'true') return data.products.filter(product => product.isPublished)
  await connectToDatabase()
  return Product.find({ isPublished: true })
    .select({ _id: 0, slug: 1, name: 1, brand: 1, category: 1, subCategory: 1 })
    .lean<CatalogProduct[]>()
}

export const getCatalogLandings = cache(async () => buildCatalogLandings(await readPublishedCatalog()))
