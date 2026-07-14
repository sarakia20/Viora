/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
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
import {
  deleteProduct,
  getAllProductsForAdmin,
} from '@/lib/actions/product.actions'
import { IProduct } from '@/lib/db/models/product.model'

import React, { useEffect, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { formatDateTime, formatId } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type ProductListDataProps = {
  products: IProduct[]
  totalPages: number
  totalProducts: number
  to: number
  from: number
}
const ProductList = () => {
  const [page, setPage] = useState<number>(1)
  const [inputValue, setInputValue] = useState<string>('')
  const [data, setData] = useState<ProductListDataProps>()
  const [isPending, startTransition] = useTransition()

  const handlePageChange = (changeType: 'next' | 'prev') => {
    const newPage = changeType === 'next' ? page + 1 : page - 1
    if (changeType === 'next') {
      setPage(newPage)
    } else {
      setPage(newPage)
    }
    startTransition(async () => {
      const data = await getAllProductsForAdmin({
        query: inputValue,
        page: newPage,
      })
      setData(data)
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    if (value) {
      clearTimeout((window as any).debounce)
      ;(window as any).debounce = setTimeout(() => {
        startTransition(async () => {
          const data = await getAllProductsForAdmin({ query: value, page: 1 })
          setData(data)
        })
      }, 500)
    } else {
      startTransition(async () => {
        const data = await getAllProductsForAdmin({ query: '', page })
        setData(data)
      })
    }
  }
  useEffect(() => {
    startTransition(async () => {
      const data = await getAllProductsForAdmin({ query: '' })
      setData(data)
    })
  }, [])

  return (
    <div>
      <div className='space-y-2'>
        <div className='flex-between flex-wrap gap-2'>
          <div className='flex flex-wrap items-center gap-2 '>
            <h1 className='font-bold text-lg'>محصولات</h1>
            <div className='flex flex-wrap items-center  gap-2 '>
              <Input
                className='w-auto'
                type='text '
                value={inputValue}
                onChange={handleInputChange}
                placeholder='جستجوی محصول...'
              />

              {isPending ? (
                <p>در حال بارگذاری...</p>
              ) : (
                <p>
                  {data?.totalProducts === 0
  ? 'نتیجه‌ای یافت نشد'
  : `${data?.from} تا ${data?.to} از ${data?.totalProducts} محصول`}
                </p>
              )}
            </div>
          </div>

          <Button asChild variant='default'>
            <Link href='/admin/products/create'>افزودن محصول</Link>
          </Button>
        </div>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>شناسه</TableHead>
                <TableHead>نام محصول</TableHead>
                <TableHead className='text-right'>قیمت</TableHead>
                <TableHead>دسته‌بندی</TableHead>
                <TableHead>موجودی</TableHead>
                <TableHead>امتیاز</TableHead>
                <TableHead>وضعیت نمایش</TableHead>
                <TableHead>آخرین بروزرسانی</TableHead>
                <TableHead className='w-[100px]'>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.products.map((product: IProduct) => (
                <TableRow key={product._id.toString()}>
                  <TableCell>{formatId(product._id.toString())}</TableCell>
                  <TableCell>
                    <Link href={`/admin/products/${product._id.toString()}`}>
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className='text-right'>${product.price}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.countInStock}</TableCell>
                  <TableCell>{product.avgRating}</TableCell>
                  <TableCell>{product.isPublished ? 'منتشر شده' : 'پیش‌نویس'}</TableCell>
                  <TableCell>
                    {formatDateTime(product.updatedAt).dateTime}
                  </TableCell>
                  <TableCell className='flex gap-1'>
                    <Button asChild variant='outline' size='sm'>
                      <Link href={`/admin/products/${product._id.toString()}`}>ویرایش</Link>
                    </Button>
                    <Button asChild variant='outline' size='sm'>
                      <Link target='_blank' href={`/product/${product.slug}`}>
                        مشاهده
                      </Link>
                    </Button>
                    <DeleteDialog
                      id={product._id.toString()}
                      action={deleteProduct}
                      callbackAction={() => {
                        startTransition(async () => {
                          const data = await getAllProductsForAdmin({
                            query: inputValue,
                          })
                          setData(data)
                        })
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(data?.totalPages ?? 0) > 1 && (
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                onClick={() => handlePageChange('prev')}
                disabled={Number(page) <= 1}
                className='w-24'
              >
                <ChevronLeft /> قبلی
              </Button>
             صفحه {page} از {data?.totalPages}
              <Button
                variant='outline'
                onClick={() => handlePageChange('next')}
                disabled={Number(page) >= (data?.totalPages ?? 0)}
                className='w-24'
              >
                بعدی <ChevronRight />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductList
