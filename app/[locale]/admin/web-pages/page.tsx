import Link from 'next/link'

import DeleteDialog from '@/components/shared/delete-dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatId } from '@/lib/utils'
import { Metadata } from 'next'
import { deleteWebPage, getAllWebPages } from '@/lib/actions/web-page.actions'
import { IWebPage } from '@/lib/db/models/web-page.model'

export const metadata: Metadata = {
  title: 'مدیریت صفحات سایت',
}

export default async function WebPageAdminPage() {
  const webPages = await getAllWebPages()

  return (
    <div className='space-y-4'>
      <div className='flex-between'>
        <h1 className='h1-bold'>صفحات سایت</h1>

        <Button asChild variant='default'>
          <Link href='/admin/web-pages/create'>
            ایجاد صفحه جدید
          </Link>
        </Button>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[100px]'>شناسه</TableHead>
              <TableHead>عنوان صفحه</TableHead>
              <TableHead>آدرس</TableHead>
              <TableHead>وضعیت انتشار</TableHead>
              <TableHead className='w-[100px]'>عملیات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {webPages.map((webPage: IWebPage) => (
              <TableRow key={webPage._id.toString()}>
                <TableCell>{formatId(webPage._id.toString())}</TableCell>
                <TableCell>{webPage.title}</TableCell>
                <TableCell>{webPage.slug}</TableCell>

                <TableCell>
                  {webPage.isPublished ? 'منتشر شده' : 'پیش‌نویس'}
                </TableCell>

                <TableCell className='flex gap-1'>
                  <Button asChild variant='outline' size='sm'>
                   <Link href={`/admin/web-pages/${webPage._id.toString()}`}>
                      ویرایش
                    </Link>
                  </Button>

                  <DeleteDialog
                 id={webPage._id.toString()}
                    action={deleteWebPage}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
