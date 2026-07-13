'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IOrder } from '@/lib/db/models/order.model'
import { cn, formatDateTime } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import ProductPrice from '../product/product-price'
import ActionButton from '../action-button'
import { deliverOrder, updateOrderToPaid } from '@/lib/actions/order.actions'

export default function OrderDetailsForm({
  order,
  isAdmin,
}: {
  order: IOrder
  isAdmin: boolean
}) {
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
    expectedDeliveryDate,
  } = order

  return (
    <div className='grid md:grid-cols-3 md:gap-5'>
      <div className='overflow-x-auto md:col-span-2 space-y-4'>
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>اطلاعات ارسال</h2>
            <p>
              {shippingAddress.fullName} {shippingAddress.phone}
            </p>
            <p>
              {shippingAddress.street}, {shippingAddress.city},{' '}
              {shippingAddress.province}, {shippingAddress.postalCode},{' '}
              {shippingAddress.country}{' '}
            </p>

            {isDelivered ? (
              <Badge>
                 تحویل شده در {formatDateTime(deliveredAt!).dateTime}
              </Badge>
            ) : (
              <div>
                {' '}
                <Badge variant='destructive'>تحویل نشده</Badge>
                <div>
                  زمان تقریبی تحویل:{' '}
                  {formatDateTime(expectedDeliveryDate!).dateTime}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>روش پرداخت</h2>
            <p>{paymentMethod}</p>
            {isPaid ? (
              <Badge> پرداخت شده در {formatDateTime(paidAt!).dateTime}</Badge>
            ) : (
              <Badge variant='destructive'>پرداخت نشده</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4   gap-4'>
            <h2 className='text-xl pb-4'>محصولات سفارش</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>محصول</TableHead>
                  <TableHead>تعداد</TableHead>
                  <TableHead>قیمت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.slug}>
                    <TableCell>
                      <Link
                        href={`/product/${item.slug}`}
                        className='flex items-center'
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={50}
                          height={50}
                        ></Image>
                        <span className='px-2'>{item.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className='px-2'>{item.quantity}</span>
                    </TableCell>
                   <TableCell className='text-right'>
  {item.price.toLocaleString('fa-IR')} تومان
</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardContent className='p-4  space-y-4 gap-4'>
            <h2 className='text-xl pb-4'>خلاصه سفارش</h2>
            <div className='flex justify-between'>
              <div>جمع کالاها</div>
              <div>
                {' '}
                <ProductPrice price={itemsPrice} plain />
              </div>
            </div>
            <div className='flex justify-between'>
              <div>مالیات</div>
              <div>
                {' '}
                <ProductPrice price={taxPrice} plain />
              </div>
            </div>
            <div className='flex justify-between'>
              <div>هزینه ارسال</div>
              <div>
                {' '}
                <ProductPrice price={shippingPrice} plain />
              </div>
            </div>
            <div className='flex justify-between'>
              <div>مبلغ نهایی</div>
              <div>
                {' '}
                <ProductPrice price={totalPrice} plain />
              </div>
            </div>

            {!isPaid && ['Stripe', 'PayPal'].includes(paymentMethod) && (
              <Link
                className={cn(buttonVariants(), 'w-full')}
                href={`/checkout/${order._id}`}
              >
                پرداخت سفارش
              </Link>
            )}

            {isAdmin && !isPaid && paymentMethod === 'Cash On Delivery' && (
              <ActionButton
                caption='ثبت پرداخت'
                action={() => updateOrderToPaid(order._id.toString())}
              />
            )}
            {isAdmin && isPaid && !isDelivered && (
              <ActionButton
                caption='ثبت تحویل سفارش'
                action={() => deliverOrder(order._id.toString())}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
