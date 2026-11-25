'use server'

import data from '@/lib/data'
import { connectToDatabase } from '@/lib/db'
import Product, { IProduct } from '@/lib/db/models/product.model'
import { revalidatePath } from 'next/cache'
import { formatError } from '../utils'
import { ProductInputSchema, ProductUpdateSchema } from '../validator'
import { IProductInput } from '@/types'
import { z } from 'zod'
import { getSetting } from './setting.actions'
import { requireAdmin } from '../auth-guard'
import { normalizeProduct } from '../product-display'
import { productSearchPattern } from '../product-search'
import { Types } from 'mongoose'

const isSkipDb = process.env.SKIP_DB === 'true'

const mockProducts = data.products.map((product, index) => ({
  ...product,
  _id: `mock-${index + 1}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})) as unknown as IProduct[]

function prepareSearchProduct(product: Pick<IProduct, '_id' | 'slug' | 'name'>) {
  const rawId = product?._id
  const id = typeof rawId === 'string' ? rawId : rawId instanceof Types.ObjectId ? rawId.toHexString() : undefined
  const slug = typeof product?.slug === 'string' ? product.slug : undefined
  try {
    if (!id || !slug?.trim() || typeof product.name !== 'string') {
      throw new TypeError('Invalid product identity')
    }
    // encodeURIComponent in the card path rejects malformed Unicode.
    encodeURIComponent(slug)
    return normalizeProduct(JSON.parse(JSON.stringify(product)) as IProduct)
  } catch {
    console.error('[catalog] Could not prepare product for search', {
      productId: id?.slice(0, 100),
      slug: slug?.slice(0, 200),
    })
    return null
  }
}

function productNameFilter(query: unknown) {
  const pattern = productSearchPattern(query)
  return pattern ? { name: { $regex: pattern, $options: 'i' } } : {}
}

function filterProducts({
  query,
  category,
  subCategory,
  brand,
  tag,
  price,
  rating,
}: {
  query?: string
  category?: string | readonly string[]
  subCategory?: string
  brand?: string
  tag?: string
  price?: string
  rating?: string
}) {
  const pattern = productSearchPattern(query)
  const nameMatcher = pattern ? new RegExp(pattern, 'iu') : undefined
  return mockProducts.filter((product) => {
    if (!product.isPublished) return false

    if (nameMatcher && !nameMatcher.test(product.name)) {
      return false
    }

    if (category && category !== 'all' &&
      !(typeof category === 'string' ? [category] : category).includes(product.category)) {
      return false
    }

    if (
      subCategory &&
      subCategory !== 'all' &&
      product.subCategory !== subCategory
    ) {
      return false
    }

    if (brand && brand !== 'all' && product.brand !== brand) {
      return false
    }

    if (tag && tag !== 'all' && !product.tags?.includes(tag)) {
      return false
    }

    if (rating && rating !== 'all' && product.avgRating < Number(rating)) {
      return false
    }

    if (price && price !== 'all') {
      const [min, max] = price.split('-').map(Number)
      if (product.price < min || product.price > max) return false
    }

    return true
  })
}

function sortProducts(products: IProduct[], sort?: string) {
  const sorted = [...products]

  if (sort === 'best-selling') {
    sorted.sort((a, b) => b.numSales - a.numSales)
  } else if (sort === 'price-low-to-high') {
    sorted.sort((a, b) => a.price - b.price)
  } else if (sort === 'price-high-to-low') {
    sorted.sort((a, b) => b.price - a.price)
  } else if (sort === 'avg-customer-review') {
    sorted.sort((a, b) => b.avgRating - a.avgRating)
  } else {
    sorted.reverse()
  }

  return sorted
}

export async function createProduct(dataInput: IProductInput) {
  await requireAdmin()
  if (isSkipDb) {
    return {
      success: false,
      message: 'در حالت طراحی امکان ذخیره اطلاعات وجود ندارد',
    }
  }

  try {
    const product = ProductInputSchema.parse(dataInput)
    await connectToDatabase()
    await Product.create(product)
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'محصول با موفقیت ایجاد شد',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function updateProduct(dataInput: z.infer<typeof ProductUpdateSchema>) {
  await requireAdmin()
  if (isSkipDb) {
    return {
      success: false,
      message: 'در حالت طراحی امکان ذخیره اطلاعات وجود ندارد',
    }
  }

  try {
    const product = ProductUpdateSchema.parse(dataInput)
    await connectToDatabase()
    await Product.findByIdAndUpdate(product._id, product)
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'محصول با موفقیت بروزرسانی شد',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function deleteProduct(id: string) {
  await requireAdmin()
  if (isSkipDb) {
    return {
      success: false,
      message: 'در حالت طراحی امکان ذخیره اطلاعات وجود ندارد',
    }
  }

  try {
    await connectToDatabase()
    const res = await Product.findByIdAndDelete(id)
    if (!res) throw new Error('محصول یافت نشد')
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'محصول با موفقیت حذف شد',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getProductById(productId: string) {
  await requireAdmin()
  if (isSkipDb) {
    const product = mockProducts.find((p) => p._id.toString() === productId)
    return JSON.parse(JSON.stringify(product || null)) as IProduct
  }

  await connectToDatabase()
  const product = await Product.findById(productId)
  return JSON.parse(JSON.stringify(product)) as IProduct
}

export async function getAllProductsForAdmin({
  query,
  page = 1,
  sort = 'latest',
  limit,
}: {
  query: string
  page?: number
  sort?: string
  limit?: number
}) {
  await requireAdmin()
  const {
    common: { pageSize },
  } = await getSetting()

  limit = limit || pageSize

  if (isSkipDb) {
    const filtered = filterProducts({ query })
    const sorted = sortProducts(filtered, sort)
    const start = limit * (Number(page) - 1)
    const products = sorted.slice(start, start + limit)

    return {
      products: JSON.parse(JSON.stringify(products)) as IProduct[],
      totalPages: Math.ceil(filtered.length / limit),
      totalProducts: filtered.length,
      from: filtered.length === 0 ? 0 : start + 1,
      to: start + products.length,
    }
  }

  await connectToDatabase()

  const queryFilter = productNameFilter(query)

  const order: Record<string, 1 | -1> =
    sort === 'best-selling'
      ? { numSales: -1 }
      : sort === 'price-low-to-high'
        ? { price: 1 }
        : sort === 'price-high-to-low'
          ? { price: -1 }
          : sort === 'avg-customer-review'
            ? { avgRating: -1 }
            : { _id: -1 }

  const products = await Product.find({
    ...queryFilter,
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countProducts = await Product.countDocuments({
    ...queryFilter,
  })

  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / pageSize),
    totalProducts: countProducts,
    from: pageSize * (Number(page) - 1) + 1,
    to: pageSize * (Number(page) - 1) + products.length,
  }
}

export async function getAllCategories() {
  const requiredCategories = ['کف شور']

  if (isSkipDb) {
    const categories = Array.from(
      new Set(mockProducts.filter((p) => p.isPublished).map((p) => p.category))
    )

    return Array.from(new Set([...categories, ...requiredCategories]))
  }

  await connectToDatabase()
  const categories = await Product.find({ isPublished: true }).distinct(
    'category'
  )
  return Array.from(new Set([...categories, ...requiredCategories]))
}

export async function hasPublishedCategorySelection(category: string, subCategory: string) {
  const selection = {
    isPublished: true,
    ...(category !== 'all' ? { category } : {}),
    ...(subCategory !== 'all' ? { subCategory } : {}),
  }
  if (isSkipDb) {
    return mockProducts.some((product) => product.isPublished &&
      (category === 'all' || product.category === category) &&
      (subCategory === 'all' || product.subCategory === subCategory))
  }
  await connectToDatabase()
  return Boolean(await Product.exists(selection))
}

export async function getBrandsByCategory({
  category,
  subCategory,
}: {
  category?: string
  subCategory?: string
}) {
  const matchesSelection = (product: IProduct) =>
    product.isPublished &&
    (!category || category === 'all' || product.category === category) &&
    (!subCategory ||
      subCategory === 'all' ||
      product.subCategory === subCategory)

  const brands = isSkipDb
    ? mockProducts.filter(matchesSelection).map((product) => product.brand)
    : await (async () => {
        await connectToDatabase()
        return Product.find({
          isPublished: true,
          ...(category && category !== 'all' ? { category } : {}),
          ...(subCategory && subCategory !== 'all' ? { subCategory } : {}),
        }).distinct('brand')
      })()

  return Array.from(
    new Set(
      brands
        .filter((brand): brand is string => typeof brand === 'string')
        .map((brand) => brand.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'fa'))
}

export async function getProductsForCard({
  tag,
  limit = 4,
}: {
  tag: string
  limit?: number
}) {
  if (isSkipDb) {
    const products = mockProducts
      .filter((p) => p.isPublished && p.tags?.includes(tag))
      .slice(0, limit)
      .map((p) => ({
        name: p.name,
        href: `/product/${p.slug}`,
        image: p.images?.[0] || '/images/placeholder.jpg',
      }))

    return JSON.parse(JSON.stringify(products)) as {
      name: string
      href: string
      image: string
    }[]
  }

  await connectToDatabase()
  const products = await Product.find(
    { tags: { $in: [tag] }, isPublished: true },
    {
      name: 1,
      href: { $concat: ['/product/', '$slug'] },
      image: { $arrayElemAt: ['$images', 0] },
    }
  )
    .sort({ createdAt: 'desc' })
    .limit(limit)

  return JSON.parse(JSON.stringify(products)) as {
    name: string
    href: string
    image: string
  }[]
}

// Listing cards need commercial display fields, not full descriptions or review breakdowns.
const cardFields = {
  name: 1, slug: 1, brand: 1, category: 1, images: 1, tags: 1, colors: 1, sizes: 1,
  price: 1, listPrice: 1, countInStock: 1, stock: 1, avgRating: 1, variants: 1,
} as const

export async function getProductsByTag({
  tag,
  limit = 10,
}: {
  tag: string
  limit?: number
}) {
  if (isSkipDb) {
    const products = mockProducts
      .filter((p) => p.isPublished && p.tags?.includes(tag))
      .slice(0, limit)

    return JSON.parse(JSON.stringify(products)) as IProduct[]
  }

  await connectToDatabase()
  const products = await Product.find({
    tags: { $in: [tag] },
    isPublished: true,
  }, cardFields, { lean: true })
    .sort({ createdAt: 'desc' })
    .limit(limit)

  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

export async function getProductBySlug(slug: string) {
  if (isSkipDb) {
    const product = mockProducts.find((p) => p.slug === slug && p.isPublished)
    if (!product) throw new Error('Product not found')
    return normalizeProduct(JSON.parse(JSON.stringify(product)) as IProduct)
  }

  await connectToDatabase()
  const product = await Product.findOne({ slug, isPublished: true }).lean()
  if (!product) throw new Error('Product not found')
  return normalizeProduct(JSON.parse(JSON.stringify(product)) as IProduct)
}

export async function getRelatedProductsByCategory({
  category,
  productId,
  limit = 4,
  page = 1,
}: {
  category: string
  productId: string
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()

  limit = limit || pageSize

  if (isSkipDb) {
    const filtered = mockProducts.filter(
      (p) => p.isPublished && p.category === category && p._id.toString() !== productId
    )

    const start = (Number(page) - 1) * limit
    const products = filtered.slice(start, start + limit)

    return {
      data: JSON.parse(JSON.stringify(products)) as IProduct[],
    }
  }

  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit

  const conditions = {
    isPublished: true,
    category,
    _id: { $ne: productId },
  }

  const products = await Product.find(conditions, cardFields, { lean: true })
    .sort({ numSales: 'desc' })
    .skip(skipAmount)
    .limit(limit)

  return {
    data: JSON.parse(JSON.stringify(products)) as IProduct[],
  }
}

export async function getAllProducts({
  query,
  slugs,
  limit,
  page,
  category,
  subCategory,
  brand,
  tag,
  price,
  rating,
  sort,
}: {
  query: string
  slugs?: readonly string[]
  category: string | readonly string[]
  subCategory?: string
  brand?: string
  tag: string
  limit?: number
  page: number
  price?: string
  rating?: string
  sort?: string
}) {
  const {
    common: { pageSize },
  } = await getSetting()

  limit = limit || pageSize

  if (isSkipDb) {
    const filtered = filterProducts({
      query,
      category,
      subCategory,
      brand,
      tag,
      price,
      rating,
    })

    const eligible = slugs ? new Set(slugs) : null
    const sorted = sortProducts(filtered.filter(product => !eligible || eligible.has(product.slug)), sort)
    const start = limit * (Number(page) - 1)
    const products = sorted.slice(start, start + limit).flatMap((product) => prepareSearchProduct(product) ?? [])

    return {
      products,
      totalPages: Math.ceil(sorted.length / limit),
      totalProducts: sorted.length,
      from: sorted.length === 0 ? 0 : start + 1,
      to: start + products.length,
    }
  }

  await connectToDatabase()

  const queryFilter = productNameFilter(query)

  const categoryFilter =
    category && category !== 'all'
      ? { category: typeof category === 'string' ? category : { $in: [...category] } }
      : {}
  const subCategoryFilter =
    subCategory && subCategory !== 'all' ? { subCategory } : {}
  const brandFilter = brand && brand !== 'all' ? { brand } : {}
  const tagFilter = tag && tag !== 'all' ? { tags: tag } : {}

  const ratingFilter =
    rating && rating !== 'all'
      ? {
          avgRating: {
            $gte: Number(rating),
          },
        }
      : {}

  const priceFilter =
    price && price !== 'all'
      ? {
          price: {
            $gte: Number(price.split('-')[0]),
            $lte: Number(price.split('-')[1]),
          },
        }
      : {}

  const order: Record<string, 1 | -1> =
    sort === 'best-selling'
      ? { numSales: -1 }
      : sort === 'price-low-to-high'
        ? { price: 1 }
        : sort === 'price-high-to-low'
          ? { price: -1 }
          : sort === 'avg-customer-review'
            ? { avgRating: -1 }
            : { _id: -1 }

  const isPublished = { isPublished: true }

  const conditions = {
  ...isPublished,
  ...(slugs ? { slug: { $in: [...slugs] } } : {}),
  ...queryFilter,
  ...tagFilter,
  ...categoryFilter,
  ...subCategoryFilter,
  ...brandFilter,
  ...priceFilter,
  ...ratingFilter,
  }
  const countProducts = await Product.countDocuments(conditions)
  // Avoid a large skip query for an out-of-range category page.
  const products = page > Math.ceil(countProducts / limit) ? [] : await Product.find(conditions, cardFields)
  .sort({ ...order, _id: order._id ?? -1 })
  .skip(limit * (Number(page) - 1))
  .limit(limit)
  .lean()

  const prepared = products.flatMap((product) => {
    const result = prepareSearchProduct(product)
    return result ? [result] : []
  })
  const uniqueProducts = Array.from(new Map(prepared.map((product) => [product._id, product])).values())

  return {
    products: uniqueProducts,
    totalPages: Math.ceil(countProducts / limit),
    totalProducts: countProducts,
    from: limit * (Number(page) - 1) + 1,
    to: limit * (Number(page) - 1) + uniqueProducts.length,
  }
}

export async function getAllTags() {
  if (isSkipDb) {
    const tags = Array.from(
      new Set(mockProducts.flatMap((product) => product.tags || []))
    )

    return tags
      .sort((a, b) => a.localeCompare(b))
      .map((x) =>
        x
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      )
  }

  const tags = await Product.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: null, uniqueTags: { $addToSet: '$tags' } } },
    { $project: { _id: 0, uniqueTags: 1 } },
  ])

  return (
    (tags[0]?.uniqueTags
      .sort((a: string, b: string) => a.localeCompare(b))
      .map((x: string) =>
        x
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      ) as string[]) || []
  )
}
