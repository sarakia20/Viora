import Link from 'next/link'
import ProductForm from '../product-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'افزودن محصول',
}

const CreateProductPage = () => {
  return (
    <main className='max-w-6xl mx-auto p-4'>
      <div className='flex mb-4 text-sm text-slate-600'>
        <Link href='/admin/products'>محصولات</Link>
        <span className='mx-1'>›</span>
        <Link href='/admin/products/create'>افزودن محصول</Link>
      </div>

      <div className='my-8'>
        <ProductForm type='Create' />
      </div>
    </main>
  )
}

export default CreateProductPage
