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

const isSkipDb = process.env.SKIP_DB === 'true'

const mockProducts = data.products.map((product, index) => ({
  ...product,
  _id: `mock-${index + 1}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})) as unknown as IProduct[]

function filterProducts({
  query,
  category,
  tag,
  price,
  rating,
}: {
  query?: string
  category?: string
  tag?: string
  price?: string
  rating?: string
}) {
  return mockProducts.filter((product) => {
    if (!product.isPublished) return false

    if (
      query &&
      query !== 'all' &&
      !product.name.toLowerCase().includes(query.toLowerCase())
    ) {
      return false
    }

    if (category && category !== 'all' && product.category !== category) {
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
  if (isSkipDb) {
    const product = mockProducts.find((p) => p._id === productId)
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

  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
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
  if (isSkipDb) {
    return Array.from(
      new Set(mockProducts.filter((p) => p.isPublished).map((p) => p.category))
    )
  }

  await connectToDatabase()
  const categories = await Product.find({ isPublished: true }).distinct(
    'category'
  )
   return JSON.parse(JSON.stringify(categories))
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
  })
    .sort({ createdAt: 'desc' })
    .limit(limit)

  return JSON.parse(JSON.stringify(products)) as IProduct[]
}

export async function getProductBySlug(slug: string) {
  if (isSkipDb) {
    const product = mockProducts.find((p) => p.slug === slug && p.isPublished)
    if (!product) throw new Error('Product not found')
    return JSON.parse(JSON.stringify(product)) as IProduct
  }

  await connectToDatabase()
  const product = await Product.findOne({ slug, isPublished: true })
  if (!product) throw new Error('Product not found')
  return JSON.parse(JSON.stringify(product)) as IProduct
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
      (p) => p.isPublished && p.category === category && p._id !== productId
    )

    const start = (Number(page) - 1) * limit
    const products = filtered.slice(start, start + limit)

    return {
      data: JSON.parse(JSON.stringify(products)) as IProduct[],
      totalPages: Math.ceil(filtered.length / limit),
    }
  }

  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit

  const conditions = {
    isPublished: true,
    category,
    _id: { $ne: productId },
  }

  const products = await Product.find(conditions)
    .sort({ numSales: 'desc' })
    .skip(skipAmount)
    .limit(limit)

  const productsCount = await Product.countDocuments(conditions)

  return {
    data: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(productsCount / limit),
  }
}

export async function getAllProducts({
  query,
  limit,
  page,
  category,
  tag,
  price,
  rating,
  sort,
}: {
  query: string
  category: string
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
      tag,
      price,
      rating,
    })

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

  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}

  const categoryFilter = category && category !== 'all' ? { category } : {}
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

  const products = await Product.find({
    ...isPublished,
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countProducts = await Product.countDocuments({
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })

  return {
    products: JSON.parse(JSON.stringify(products)) as IProduct[],
    totalPages: Math.ceil(countProducts / limit),
    totalProducts: countProducts,
    from: limit * (Number(page) - 1) + 1,
    to: limit * (Number(page) - 1) + products.length,
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