import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Order from '@/lib/db/models/order.model'
import { sendPurchaseReceipt } from '@/emails'
import { SITE_URL } from '@/lib/site-url'

export const runtime = 'nodejs'

function getCallbackOrigin() {
  const configuredUrl = process.env.ZARINPAL_CALLBACK_BASE_URL || SITE_URL
  let parsedUrl: URL

  try {
    parsedUrl = new URL(configuredUrl)
  } catch {
    throw new Error('Invalid ZarinPal callback URL configuration')
  }

  const isAllowedProtocol =
    parsedUrl.protocol === 'https:' ||
    (process.env.NODE_ENV === 'development' && parsedUrl.protocol === 'http:')

  if (
    !isAllowedProtocol ||
    !parsedUrl.hostname ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== '/' ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error('Invalid ZarinPal callback URL configuration')
  }

  return parsedUrl.origin
}

function resultUrl(orderId: string, result: 'success' | 'failed', origin: string) {
  return new URL(`/checkout/${encodeURIComponent(orderId)}/zarinpal-result?result=${result}`, origin)
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId') || ''
  const authority = request.nextUrl.searchParams.get('Authority') || ''
  const status = request.nextUrl.searchParams.get('Status') || ''
  if (!/^[a-f\d]{24}$/i.test(orderId) || !authority) {
    return NextResponse.redirect(new URL('/checkout?payment=invalid', SITE_URL))
  }

  let callbackOrigin: string
  try {
    callbackOrigin = getCallbackOrigin()
  } catch {
    console.error('[zarinpal] invalid callback URL configuration', { stage: 'validate_callback_url' })
    return NextResponse.redirect(new URL('/checkout?payment=failed', SITE_URL))
  }

  let stage = 'connect_database'
  try {
    await connectToDatabase()
    stage = 'match_order'
    const order = await Order.findById(orderId).populate<{ user: { email?: string } }>('user', 'email')
    if (!order || order.paymentMethod !== 'ZarinPal' || order.paymentAuthority !== authority) {
      console.error('[zarinpal] callback did not match a pending order', {
        stage: 'match_callback',
        orderFound: Boolean(order),
        paymentMethodMatched: order?.paymentMethod === 'ZarinPal',
        authorityMatched: order?.paymentAuthority === authority,
      })
      return NextResponse.redirect(resultUrl(orderId, 'failed', callbackOrigin))
    }
    if (order.isPaid) return NextResponse.redirect(resultUrl(orderId, 'success', callbackOrigin))
    if (status !== 'OK') {
      console.info('[zarinpal] customer did not complete payment', { stage: 'callback_status', status })
      return NextResponse.redirect(resultUrl(orderId, 'failed', callbackOrigin))
    }

    const merchantId = process.env.ZARINPAL_MERCHANT_ID
    if (!merchantId) {
      console.error('[zarinpal] merchant configuration missing', { stage: 'verify_payment' })
      return NextResponse.redirect(resultUrl(orderId, 'failed', callbackOrigin))
    }
    const amount = Math.round(order.totalPrice * 10)
    stage = 'verify_payment'
    const response = await fetch('https://api.zarinpal.com/pg/v4/payment/verify.json', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ merchant_id: merchantId, amount, authority }),
      cache: 'no-store',
    })
    const httpStatus = response.status
    const verification = await response.json()
    const data = verification?.data
    const code = data?.code
    const refId = data?.ref_id
    const validRefId = Number.isSafeInteger(refId) && refId > 0
    if (!Number.isSafeInteger(amount) || amount < 1000 || !response.ok || ![100, 101].includes(code) || !validRefId) {
      console.error('[zarinpal] payment verification rejected', {
        stage: 'verify_payment',
        httpStatus,
        providerCode: code,
        hasReferenceId: Boolean(refId),
        amountValid: Number.isSafeInteger(amount) && amount >= 1000,
        providerErrorCodes: Array.isArray(verification?.errors)
          ? verification.errors.map((item: { code?: unknown }) => String(item?.code ?? 'unknown')).slice(0, 5)
          : [],
      })
      return NextResponse.redirect(resultUrl(orderId, 'failed', callbackOrigin))
    }

    const paidOrder = await Order.findOneAndUpdate(
      { _id: order._id, isPaid: false, paymentMethod: 'ZarinPal', paymentAuthority: authority, totalPrice: order.totalPrice },
      { $set: {
        isPaid: true,
        paidAt: new Date(),
        paymentRefId: String(refId),
        paymentResult: { id: String(refId), status: 'COMPLETED', email_address: order.user?.email || '', pricePaid: String(amount) },
      } },
      { new: true }
    )
    stage = 'save_verified_payment'
    if (!paidOrder) {
      const latest = await Order.findById(orderId).select('isPaid paymentRefId')
      if (latest?.isPaid) return NextResponse.redirect(resultUrl(orderId, 'success', callbackOrigin))
      return NextResponse.redirect(resultUrl(orderId, 'failed', callbackOrigin))
    }
    await paidOrder.populate('user', 'email')
    stage = 'send_receipt'
    try {
      if (paidOrder.user && typeof paidOrder.user === 'object' && 'email' in paidOrder.user && paidOrder.user.email)
        await sendPurchaseReceipt({ order: paidOrder as never })
    } catch (error) {
      console.error('ZarinPal receipt email failed', error)
    }
    return NextResponse.redirect(resultUrl(orderId, 'success', callbackOrigin))
  } catch (error) {
    console.error('[zarinpal] callback processing failed', {
      stage,
      errorName: error instanceof Error ? error.name : 'UnknownError',
    })
    return NextResponse.redirect(resultUrl(orderId, 'failed', callbackOrigin))
  }
}
