import { notFound } from 'next/navigation'
import React from 'react'

import { auth } from '@/auth'
import { getOrderById } from '@/lib/actions/order.actions'
import OrderDetailsForm from '@/components/shared/order/order-details-form'
import Link from 'next/link'
import ShippingDetails from './shipping-details'

export const metadata = {
  title: 'جزئیات سفارش',
}

const AdminOrderDetailsPage = async (props: {
  params: Promise<{
    id: string
  }>
}) => {
  const params = await props.params
  const { id } = params

  const order = await getOrderById(id)
  if (!order) notFound()

  const session = await auth()

  return (
    <main dir='rtl' className='mx-auto max-w-6xl text-slate-900 sm:p-4'>
      <div className='flex mb-4 text-sm text-slate-600'>
        <Link href='/admin/orders'>سفارش‌ها</Link>
        <span className='mx-1'>›</span>
        <Link href={`/admin/orders/${order._id}`}>جزئیات سفارش</Link>
      </div>

      <OrderDetailsForm
        order={order}
        isAdmin={session?.user?.role === 'Admin' || false}
        shippingDetails={<ShippingDetails address={order.shippingAddress} />}
      />
    </main>
  )
}

export default AdminOrderDetailsPage
