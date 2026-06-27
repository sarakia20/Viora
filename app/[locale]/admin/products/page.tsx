import { Metadata } from 'next'
import ProductList from './product-list'

export const metadata: Metadata = {
  title: 'مدیریت محصولات',
}

export default async function AdminProduct() {
  return <ProductList />
}
