import { notFound } from 'next/navigation'
import React from 'react'

import { auth } from '@/auth'
import { getOrderById } from '@/lib/actions/order.actions'
import PaymentForm from './payment-form'
import Stripe from 'stripe'
import { startZarinPalPayment } from '@/lib/actions/order.actions'
import ZarinPalSubmit from './zarinpal-submit'

export const metadata = {
  title: 'پرداخت سفارش',
}

const CheckoutPaymentPage = async (props: {
  searchParams: Promise<{ paymentError?: string }>
  params: Promise<{
    id: string
  }>
}) => {
  const params = await props.params

  const { id } = params
  const { paymentError } = await props.searchParams

  const order = await getOrderById(id)
  if (!order) notFound()

  const session = await auth()

  let client_secret = null
  if (order.paymentMethod === 'Stripe' && !order.isPaid) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100),
      currency: 'USD',
      metadata: { orderId: order._id.toString() },
    })
    client_secret = paymentIntent.client_secret
  }
  return (
    <PaymentForm
      zarinpalPayment={order.paymentMethod === 'ZarinPal' && !order.isPaid ? (
        <form action={startZarinPalPayment.bind(null, id)} className='space-y-3'>
          <ZarinPalSubmit />
          {paymentError && <p role='alert' className='text-sm text-red-700'>شروع پرداخت ناموفق بود. لطفاً دوباره تلاش کنید؛ اگر مشکل ادامه داشت با پشتیبانی تماس بگیرید.</p>}
          <noscript><p>پس از ارسال فرم، برای اتصال به درگاه منتظر بمانید.</p></noscript>
        </form>
      ) : null}
      order={order}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || 'sb'}
      clientSecret={client_secret}
      isAdmin={session?.user?.role === 'Admin' || false}
    />
  )
}

export default CheckoutPaymentPage
