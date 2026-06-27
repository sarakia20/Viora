'use server'

import { connectToDatabase } from '@/lib/db'
import Category from '@/lib/db/models/category.model'
import { revalidatePath } from 'next/cache'

export async function deleteCategory(id: string) {
  try {
    await connectToDatabase()

    await Category.findByIdAndDelete(id)

    revalidatePath('/admin/categories')

    return {
      success: true,
      message: 'دسته‌بندی حذف شد',
    }
  } catch (error) {
    return {
      success: false,
      message: 'خطا در حذف دسته‌بندی',
    }
  }
}

export async function getCategoryById(id: string) {
  await connectToDatabase()

  const category = await Category.findById(id).lean()

  return JSON.parse(JSON.stringify(category))
}

export async function updateCategory(data: {
  id: string
  name: string
  slug: string
}) {
  try {
    await connectToDatabase()

    await Category.findByIdAndUpdate(data.id, {
      name: data.name,
      slug: data.slug,
    })

    revalidatePath('/admin/categories')

    return {
      success: true,
      message: 'دسته‌بندی بروزرسانی شد',
    }
  } catch (error) {
    return {
      success: false,
      message: 'خطا در بروزرسانی دسته‌بندی',
    }
  }
}

export async function getAllCategoriesTree() {
  await connectToDatabase()

  const categories = await Category.find({ isPublished: true })
    .sort({ createdAt: 1 })
    .lean()

  return JSON.parse(JSON.stringify(categories))
}

export async function createCategory(data: {
  name: string
  slug: string
  parentId?: string | null
}) {
  try {
    await connectToDatabase()

    const category = await Category.create({
      name: data.name.trim(),
      slug: data.slug.trim(),
      parentId: data.parentId || null,
      isPublished: true,
    })

    revalidatePath('/admin/categories')
    revalidatePath('/')

    return {
      success: true,
      message: 'دسته‌بندی با موفقیت ایجاد شد',
      data: JSON.parse(JSON.stringify(category)),
    }
  } catch (error) {
    console.error('CATEGORY CREATE ERROR:', error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'خطا در ایجاد دسته‌بندی',
    }
  }
}