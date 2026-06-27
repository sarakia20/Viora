import { getAllCategoriesTree } from '@/lib/actions/category.actions'
import CategoryForm from './category-form'
import Link from 'next/link'
import { deleteCategory } from '@/lib/actions/category.actions'

export default async function CategoriesPage() {
  const categories = await getAllCategoriesTree()

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>مدیریت دسته‌بندی‌ها</h1>

      <CategoryForm categories={categories} />

      <div className='rounded-xl border bg-card overflow-hidden'>
        <table className='w-full'>
          <thead>
  <tr className='border-b bg-muted'>
    <th className='p-3 text-right'>نام</th>
    <th className='p-3 text-right'>اسلاگ</th>
    <th className='p-3 text-right'>نوع</th>
    <th className='p-3 text-right'>عملیات</th>
  </tr>
</thead>

        <tbody>
  {categories.map((category: any) => (
    <tr key={category._id} className='border-b'>
      <td className='p-3'>{category.name}</td>
      <td className='p-3'>{category.slug}</td>
      <td className='p-3'>
        {category.parentId ? 'زیرمجموعه' : 'دسته اصلی'}
      </td>

      <td className='p-3'>
        <div className='flex gap-2 justify-end'>
          <Link
            href={`/admin/categories/${category._id}`}
            className='px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition'
          >
            ویرایش
          </Link>

          <form
            action={async () => {
              'use server'
              await deleteCategory(category._id)
            }}
          >
            <button
              type='submit'
              className='px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition'
            >
              حذف
            </button>
          </form>
        </div>
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </div>
  )
}