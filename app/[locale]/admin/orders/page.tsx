import { Metadata } from 'next'
import Link from 'next/link'

import { auth } from '@/auth'
import DeleteDialog from '@/components/shared/delete-dialog'
import Pagination from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteOrder, getAllOrders } from '@/lib/actions/order.actions'
import { formatDateTime, formatId } from '@/lib/utils'
import { IOrderList } from '@/types'
import ProductPrice from '@/components/shared/product/product-price'

export const metadata: Metadata = {
  title: 'مدیریت سفارش‌ها',
}

export default async function OrdersPage(props: {
  searchParams: Promise<{ page: string }>
}) {
  const searchParams = await props.searchParams
  const { page = '1' } = searchParams

  const session = await auth()
  if (session?.user.role !== 'Admin') {
    throw new Error('دسترسی مدیریت لازم است')
  }

  const orders = await getAllOrders({
    page: Number(page),
  })

  return (
    <div className='space-y-4'>
      <h1 className='h1-bold'>سفارش‌ها</h1>

      <div className='overflow-x-auto rounded-xl border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>شناسه</TableHead>
              <TableHead>تاریخ</TableHead>
              <TableHead>خریدار</TableHead>
              <TableHead>مبلغ کل</TableHead>
              <TableHead>پرداخت</TableHead>
              <TableHead>ارسال</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orders.data.map((order: IOrderList) => (
              <TableRow key={order._id}>
                <TableCell>{formatId(order._id)}</TableCell>

                <TableCell>
                  {formatDateTime(order.createdAt!).dateTime}
                </TableCell>

                <TableCell>
                  {order.user ? order.user.name : 'کاربر حذف‌شده'}
                </TableCell>

                <TableCell>
                  <ProductPrice price={order.totalPrice} plain />
                </TableCell>

                <TableCell>
                  {order.isPaid && order.paidAt
                    ? formatDateTime(order.paidAt).dateTime
                    : 'پرداخت نشده'}
                </TableCell>

                <TableCell>
                  {order.isDelivered && order.deliveredAt
                    ? formatDateTime(order.deliveredAt).dateTime
                    : 'ارسال نشده'}
                </TableCell>

                <TableCell className='flex gap-2'>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/orders/${order._id}`}>جزئیات</Link>
                  </Button>

                  <DeleteDialog id={order._id} action={deleteOrder} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {orders.totalPages > 1 && (
          <div className='p-4'>
            <Pagination page={page} totalPages={orders.totalPages!} />
          </div>
        )}
      </div>
    </div>
  )
}
