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
import { deleteUser, getAllUsers } from '@/lib/actions/user.actions'
import { formatId } from '@/lib/utils'
import { formatAdminDigits } from '@/lib/admin-display'

export const metadata: Metadata = {
  title: 'مدیریت کاربران',
}

export default async function AdminUser(props: {
  searchParams: Promise<{ page: string }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()

  if (session?.user.role !== 'Admin') {
    throw new Error('دسترسی مدیریت لازم است')
  }

  const requestedPage = Number(searchParams.page)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const users = await getAllUsers({
    page,
  })

  return (
    <div dir='rtl' className='space-y-4 text-slate-900'>
      <h1 className='h1-bold text-slate-900'>کاربران</h1>

      <div className='overflow-hidden rounded-xl border border-slate-200 bg-white'>
        <p id='users-scroll' className='border-b border-slate-100 px-4 py-2 text-xs text-slate-600 md:hidden'>
          برای دیدن همه ستون‌ها، جدول را افقی بکشید.
        </p>
        <Table aria-describedby='users-scroll' className='[&_td]:px-4 [&_td]:py-3 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:text-right [&_th]:text-slate-700'>
          <TableHeader>
            <TableRow>
              <TableHead>نام</TableHead>
              <TableHead>موبایل حساب</TableHead>
              <TableHead>تعداد سفارش‌ها</TableHead>
              <TableHead>شناسه</TableHead>
              <TableHead>ایمیل</TableHead>
              <TableHead>نقش</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.data.map((user) => (
              <TableRow key={user._id}>
                <TableCell className='font-medium'>{user.name || 'ثبت نشده'}</TableCell>
                <TableCell>{user.phone?.trim() ? <bdi dir='ltr'>{formatAdminDigits(user.phone)}</bdi> : 'ثبت نشده'}</TableCell>
                <TableCell>
                  <Link
                    href={{ pathname: '/admin/orders', query: { userId: user._id } }}
                    prefetch={false}
                    aria-label={`سفارش‌های ${user.name || 'کاربر'}، ${user.orderCount.toLocaleString('fa-IR')} سفارش`}
                    className='inline-flex min-h-9 min-w-10 items-center justify-center rounded-lg bg-slate-100 px-2 font-semibold text-slate-900 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2'
                  >
                    {user.orderCount.toLocaleString('fa-IR')}
                  </Link>
                </TableCell>
                <TableCell><bdi dir='ltr'>{formatAdminDigits(formatId(user._id))}</bdi></TableCell>
                <TableCell>{user.email || 'ثبت نشده'}</TableCell>
                <TableCell>
                  {user.role === 'Admin' ? 'مدیر' : 'کاربر'}
                </TableCell>
                <TableCell>
                  <div className='flex gap-2'>
                    <Button asChild variant='outline' size='sm'>
                      <Link href={`/admin/users/${user._id}`}>ویرایش</Link>
                    </Button>
                    <DeleteDialog id={user._id} action={deleteUser} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {users?.totalPages > 1 && (
          <div className='p-4'>
            <Pagination page={page} totalPages={users?.totalPages} />
          </div>
        )}
      </div>
    </div>
  )
}
