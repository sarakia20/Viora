'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCategory } from '@/lib/actions/category.actions'

export default function CategoryForm({
  categories,
}: {
  categories: { _id: string; name: string; parentId?: string | null }[]
}) {
  const router = useRouter()

  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [loading, setLoading] = useState(false)

  const makeSlug = (value: string) => {
    return value.trim().replace(/\s+/g, '-')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)

    const res = await createCategory({
      name,
      slug: makeSlug(name),
      parentId: parentId || null,
    })

    setLoading(false)

    if (res.success) {
      setName('')
      setParentId('')
      router.refresh()
    } else {
      alert(res.message)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='rounded-xl border bg-card p-4 space-y-4'
    >
      <h2 className='text-xl font-bold'>افزودن دسته‌بندی</h2>

      <div>
        <label className='mb-2 block text-sm font-medium'>نام دسته</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
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
            .filter((category) => !category.parentId)
            .map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
        </select>
      </div>

      <Button type='submit' disabled={loading} className='w-full'>
        {loading ? 'در حال ذخیره...' : 'ذخیره دسته‌بندی'}
      </Button>
    </form>
  )
}