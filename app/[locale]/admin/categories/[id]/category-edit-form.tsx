'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateCategory } from '@/lib/actions/category.actions'

export default function CategoryEditForm({
  category,
  categories,
}: {
  category: any
  categories: any[]
}) {
  const router = useRouter()

  const [name, setName] = useState(category.name || '')
  const [slug, setSlug] = useState(category.slug || '')
  const [parentId, setParentId] = useState(category.parentId || '')
  const [loading, setLoading] = useState(false)

  const makeSlug = (value: string) => {
    return value.trim().replace(/\s+/g, '-')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await updateCategory({
      id: category._id,
      name,
      slug: slug || makeSlug(name),
      parentId: parentId || null,
    })

    setLoading(false)

    if (result.success) {
      router.push('/admin/categories')
      router.refresh()
    } else {
      alert(result.message)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='max-w-xl rounded-xl border bg-card p-4 space-y-4'
    >
      <h2 className='text-xl font-bold'>اطلاعات دسته‌بندی</h2>

      <div>
        <label className='mb-2 block text-sm font-medium'>نام دسته</label>
        <Input
          value={name}
          onChange={(e) => {
            const value = e.target.value
            setName(value)
            setSlug(makeSlug(value))
          }}
          placeholder='مثلاً هود'
          required
        />
      </div>

      <div>
        <label className='mb-2 block text-sm font-medium'>اسلاگ</label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder='مثلاً هود'
          required
        />
      </div>

      <div>
        <label className='mb-2 block text-sm font-medium'>دسته والد</label>

        <select
          className='w-full rounded-md border bg-background px-3 py-2'
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value=''>دسته اصلی</option>

          {categories
            .filter((item) => !item.parentId && item._id !== category._id)
            .map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
        </select>
      </div>

      <div className='flex gap-2'>
        <Button type='submit' disabled={loading}>
          {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </Button>

        <Button
          type='button'
          variant='outline'
          onClick={() => router.push('/admin/categories')}
        >
          بازگشت
        </Button>
      </div>
    </form>
  )
}