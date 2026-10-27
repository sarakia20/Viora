import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrderById } from '@/lib/actions/order.actions'

export default async function ZarinPalResultPage({ params }: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order || order.paymentMethod !== 'ZarinPal') notFound()

  const paid = Boolean(order.isPaid)
  return (
    <main dir='rtl' className='mx-auto max-w-2xl p-8 text-center'>
      <h1 className='mb-4 text-2xl font-bold'>
        {paid ? 'پرداخت با موفقیت انجام شد' : 'پرداخت انجام نشد یا توسط شما لغو شد'}
      </h1>
      <p className='mb-6'>
        {paid
          ? `سفارش ${order._id} پرداخت شده است. شناسه پیگیری: ${order.paymentRefId || order.paymentResult?.id}`
          : 'وضعیت سفارش پرداخت‌نشده است. برای تلاش دوباره، وارد صفحه سفارش شوید و پرداخت با زرین‌پال را انتخاب کنید.'}
      </p>
      <Link className='underline' href={`/account/orders/${order._id}`}>مشاهده سفارش</Link>
    </main>
  )
}
