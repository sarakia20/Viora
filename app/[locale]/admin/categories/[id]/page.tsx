import {
  getCategoryById,
  getAllCategoriesTree,
} from '@/lib/actions/category.actions'

import CategoryEditForm from './category-edit-form'

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const category = await getCategoryById(id)
  const categories = await getAllCategoriesTree()

  if (!category) {
    return <div>دسته‌بندی پیدا نشد</div>
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>
        ویرایش دسته‌بندی
      </h1>

      <CategoryEditForm category={category} categories={categories} />
    </div>
  )
}