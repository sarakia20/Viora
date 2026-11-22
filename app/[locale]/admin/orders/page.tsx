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
import { formatId } from '@/lib/utils'
import { formatAdminDateTime, formatAdminDigits } from '@/lib/admin-display'
import { IOrderList } from '@/types'
import ProductPrice from '@/components/shared/product/product-price'

export const metadata: Metadata = {
  title: 'مدیریت سفارش‌ها',
}

export default async function OrdersPage(props: {
  searchParams: Promise<{ page?: string; userId?: string | string[] }>
}) {
  const searchParams = await props.searchParams
  const { userId } = searchParams
  const requestedPage = Number(searchParams.page)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const session = await auth()
  if (session?.user.role !== 'Admin') {
    throw new Error('دسترسی مدیریت لازم است')
  }

  const orders = await getAllOrders({
    page,
    userId: Array.isArray(userId) ? '' : userId,
  })

  return (
    <div dir='rtl' className='space-y-4 text-slate-900'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h1 className='h1-bold'>{userId === undefined ? 'سفارش‌ها' : 'سفارش‌های کاربر'}</h1>
        {userId !== undefined && (
          <Button asChild variant='outline' size='sm'>
            <Link href='/admin/orders'>مشاهده همه سفارش‌ها</Link>
          </Button>
        )}
      </div>

      <div className='overflow-hidden rounded-xl border border-slate-200 bg-white'>
        {orders.data.length > 0 && (
          <p id='orders-scroll' className='border-b border-slate-100 px-4 py-2 text-xs text-slate-600 md:hidden'>
            برای دیدن همه ستون‌ها، جدول را افقی بکشید.
          </p>
        )}
        <Table aria-describedby={orders.data.length ? 'orders-scroll' : undefined} className='[&_td]:px-4 [&_td]:py-3 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:text-right [&_th]:text-slate-700'>
          <TableHeader>
            <TableRow>
              <TableHead>گیرنده</TableHead>
              <TableHead>خریدار</TableHead>
              <TableHead>شناسه</TableHead>
              <TableHead>تاریخ</TableHead>
              <TableHead>مبلغ کل</TableHead>
              <TableHead>پرداخت</TableHead>
              <TableHead>ارسال</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {!orders.data.length && (
              <TableRow>
                <TableCell colSpan={8} className='h-24 text-center text-slate-600'>
                  سفارشی یافت نشد
                </TableCell>
              </TableRow>
            )}
            {orders.data.map((order: IOrderList) => (
              <TableRow key={order._id}>
                <TableCell>
                  <Link href={`/admin/orders/${order._id}`} className='font-semibold text-slate-900 hover:underline'>
                    {order.shippingAddress?.fullName?.trim() || 'ثبت نشده'}
                  </Link>
                  <div className='mt-1 text-xs text-slate-600'>
                    {order.shippingAddress?.phone?.trim()
                      ? <bdi dir='ltr'>{formatAdminDigits(order.shippingAddress.phone)}</bdi>
                      : 'ثبت نشده'}
                  </div>
                </TableCell>
                <TableCell>
                  {order.user ? order.user.name?.trim() || 'ثبت نشده' : 'کاربر حذف‌شده'}
                </TableCell>
                <TableCell><bdi dir='ltr'>{formatAdminDigits(formatId(order._id))}</bdi></TableCell>

                <TableCell>
                  {order.createdAt ? formatAdminDateTime(order.createdAt) : 'ثبت نشده'}
                </TableCell>

                <TableCell>
                  <ProductPrice price={order.totalPrice} plain />
                </TableCell>

                <TableCell>
                  {order.isPaid && order.paidAt
                    ? formatAdminDateTime(order.paidAt)
                    : 'پرداخت نشده'}
                </TableCell>

                <TableCell>
                  {order.isDelivered && order.deliveredAt
                    ? formatAdminDateTime(order.deliveredAt)
                    : 'ارسال نشده'}
                </TableCell>

                <TableCell>
                  <div className='flex gap-2'>
                    <Button asChild variant='outline' size='sm'>
                      <Link href={`/admin/orders/${order._id}`}>جزئیات</Link>
                    </Button>
                    <DeleteDialog id={order._id} action={deleteOrder} />
                  </div>
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
