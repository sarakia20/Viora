'use server'

import { Cart, IOrderList, OrderItem, ShippingAddress } from '@/types'
import { formatError, round2 } from '../utils'
import { connectToDatabase } from '../db'
import { auth } from '@/auth'
import { OrderInputSchema } from '../validator'
import Order, { IOrder } from '../db/models/order.model'
import { revalidatePath } from 'next/cache'
import { sendAskReviewOrderItems, sendPurchaseReceipt } from '@/emails'
import { paypal } from '../paypal'
import { DateRange } from 'react-day-picker'
import Product from '../db/models/product.model'
import User from '../db/models/user.model'
import mongoose from 'mongoose'
import { getSetting } from './setting.actions'
import { requireAdmin, requireUser } from '../auth-guard'
import { SITE_URL } from '../site-url'

async function getOrderAccessFilter(orderId: string) {
  const session = await requireUser()
  await connectToDatabase()
  const currentUser = await User.findById(session.user.id).select('role').lean()

  return {
    _id: orderId,
    ...(currentUser?.role === 'Admin' ? {} : { user: session.user.id }),
  }
}

// CREATE
export const createOrder = async (clientSideCart: Cart) => {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session) throw new Error('User not authenticated')
    // recalculate price and delivery date on the server
    const createdOrder = await createOrderFromCart(
      clientSideCart,
      session.user.id!
    )
    return {
      success: true,
      message: 'سفارش شما با موفقیت ثبت شد',
      data: { orderId: createdOrder._id.toString() },
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
const createOrderFromCart = async (
  clientSideCart: Cart,
  userId: string
) => {
  if (!clientSideCart.items?.length) throw new Error('Cart is empty')
  const settings = await getSetting()
  if (!settings.availablePaymentMethods.some((method) => method.name === clientSideCart.paymentMethod))
    throw new Error('روش پرداخت انتخاب‌شده در فروشگاه فعال نیست')
  const canonicalItems = await Promise.all(clientSideCart.items.map(async (item) => {
    const product = await Product.findById(item.product)
    if (!product || !product.isPublished) throw new Error('Product is unavailable')
    const variant = item.color
      ? product.variants?.find((candidate) => candidate.color === item.color)
      : undefined
    if (item.color && !variant) throw new Error('Selected product option is unavailable')
    const countInStock = variant?.countInStock ?? product.countInStock
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || countInStock < item.quantity)
      throw new Error('Insufficient product stock')
    return {
      product: product._id.toString(),
      clientId: item.clientId,
      name: product.name,
      slug: product.slug,
      image: variant?.image || product.images[0],
      category: product.category,
      price: variant?.price ?? product.price,
      countInStock,
      quantity: item.quantity,
      ...(item.size ? { size: item.size } : {}),
      ...(item.color ? { color: item.color } : {}),
    }
  }))
  const cart = {
    ...clientSideCart,
    items: canonicalItems,
    ...calcDeliveryDateAndPrice({
      items: canonicalItems,
      shippingAddress: clientSideCart.shippingAddress,
      deliveryDateIndex: clientSideCart.deliveryDateIndex,
    }),
  }

  const order = OrderInputSchema.parse({
    user: userId,
    items: cart.items,
    shippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod,
    itemsPrice: cart.itemsPrice,
    shippingPrice: cart.shippingPrice,
    taxPrice: cart.taxPrice,
    totalPrice: cart.totalPrice,
    expectedDeliveryDate: cart.expectedDeliveryDate,
  })
  return await Order.create(order)
}

export async function createZarinPalPayment(orderId: string) {
  let requestId: string | undefined
  let stage = 'authenticate'
  let providerHttpStatus: number | undefined
  let providerCode: unknown
  let providerErrorCodes: string[] = []
  try {
    const session = await requireUser()
    stage = 'connect_database'
    await connectToDatabase()
    stage = 'load_order'
    const order = await Order.findOne({ _id: orderId, user: session.user.id })
    if (!order) throw new Error('سفارش پیدا نشد')
    stage = 'validate_order'
    if (order.isPaid) throw new Error('این سفارش قبلاً پرداخت شده است')
    if (order.paymentMethod !== 'ZarinPal') throw new Error('روش پرداخت این سفارش زرین‌پال نیست')
    if (order.paymentAuthority) {
      return { success: true, redirectUrl: `https://www.zarinpal.com/pg/StartPay/${encodeURIComponent(order.paymentAuthority)}` }
    }
    stage = 'validate_configuration'
    const merchantId = process.env.ZARINPAL_MERCHANT_ID
    if (!merchantId) throw new Error('تنظیم شناسه پذیرنده زرین‌پال روی سرور انجام نشده است')
    stage = 'validate_amount'
    const amount = Math.round(order.totalPrice * 10)
    if (!Number.isSafeInteger(amount) || amount < 1000)
      throw new Error('مبلغ سفارش برای پرداخت زرین‌پال معتبر نیست')

    requestId = crypto.randomUUID()
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    stage = 'acquire_payment_lock'
    const lockedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        isPaid: false,
        paymentAuthority: { $exists: false },
        $or: [
          { paymentRequestAt: { $exists: false } },
          { paymentRequestAt: { $lt: twoMinutesAgo } },
        ],
      },
      { $set: { paymentRequestId: requestId, paymentRequestAt: new Date() } },
      { new: true }
    )
    if (!lockedOrder) {
      const current = await Order.findById(order._id)
      if (current?.paymentAuthority) return { success: true, redirectUrl: `https://www.zarinpal.com/pg/StartPay/${encodeURIComponent(current.paymentAuthority)}` }
      throw new Error('درخواست پرداخت در حال پردازش است؛ چند لحظه دیگر دوباره تلاش کنید')
    }

    stage = 'create_payment_request'
    const callbackBase = new URL(process.env.ZARINPAL_CALLBACK_BASE_URL || SITE_URL)
    const callbackBaseProtocolAllowed =
      callbackBase.protocol === 'https:' ||
      (process.env.NODE_ENV === 'development' && callbackBase.protocol === 'http:')
    if (
      !callbackBaseProtocolAllowed ||
      !callbackBase.hostname ||
      callbackBase.username ||
      callbackBase.password ||
      callbackBase.pathname !== '/' ||
      callbackBase.search ||
      callbackBase.hash
    ) {
      throw new Error('Invalid ZarinPal callback URL configuration')
    }
    const callbackUrl = new URL('/api/payments/zarinpal/callback', callbackBase.origin)
    callbackUrl.searchParams.set('orderId', order._id.toString())
    const response = await fetch('https://api.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount,
        callback_url: callbackUrl.toString(),
        description: `پرداخت سفارش ${order._id}`,
        metadata: { order_id: order._id.toString() },
      }),
      cache: 'no-store',
    })
    providerHttpStatus = response.status
    const result = await response.json()
    providerCode = result?.data?.code
    providerErrorCodes = Array.isArray(result?.errors)
      ? result.errors.map((item: { code?: unknown }) => String(item?.code ?? 'unknown')).slice(0, 5)
      : []
    const authority = result?.data?.authority
    console.info('[zarinpal] payment request response', {
      stage,
      httpStatus: providerHttpStatus,
      providerCode,
      hasAuthority: typeof authority === 'string' && authority.length > 0,
      providerErrorCodes,
    })
    if (!response.ok || providerCode !== 100 || typeof authority !== 'string') {
      console.error('[zarinpal] payment request rejected', {
        stage,
        httpStatus: providerHttpStatus,
        providerCode,
        providerErrorCodes,
      })
      throw new Error('ساخت درخواست پرداخت در زرین‌پال ناموفق بود')
    }
    stage = 'save_payment_authority'
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, isPaid: false, paymentRequestId: requestId },
      { $set: { paymentAuthority: authority, paymentResult: { id: authority, status: 'PENDING', email_address: '' } }, $unset: { paymentRequestId: 1, paymentRequestAt: 1 } },
      { new: true }
    )
    if (!updated) {
      const current = await Order.findById(order._id)
      if (current?.paymentAuthority) return { success: true, redirectUrl: `https://www.zarinpal.com/pg/StartPay/${encodeURIComponent(current.paymentAuthority)}` }
      throw new Error('درخواست پرداخت سفارش هم‌زمان تغییر کرد؛ دوباره تلاش کنید')
    }
    stage = 'redirect_ready'
    return { success: true, redirectUrl: `https://www.zarinpal.com/pg/StartPay/${encodeURIComponent(authority)}` }
  } catch (error) {
    console.error('[zarinpal] payment initiation failed', {
      stage,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      httpStatus: providerHttpStatus,
      providerCode,
      providerErrorCodes,
    })
    if (requestId) {
      await Order.updateOne(
        { _id: orderId, paymentRequestId: requestId },
        { $unset: { paymentRequestId: 1, paymentRequestAt: 1 } }
      ).catch(() => undefined)
    }
    return { success: false, message: 'شروع پرداخت ناموفق بود. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.' }
  }
}

export async function updateOrderToPaid(orderId: string) {
  try {
    await requireAdmin()
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (order.isPaid) throw new Error('Order is already paid')
    order.isPaid = true
    order.paidAt = new Date()
    await order.save()
    if (!process.env.MONGODB_URI?.startsWith('mongodb://localhost'))
      await updateProductStock(order._id.toString())
    if (order.user.email) await sendPurchaseReceipt({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order paid successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}
const updateProductStock = async (orderId: string) => {
  const session = await mongoose.connection.startSession()

  try {
    session.startTransaction()
    const opts = { session }

    const order = await Order.findOneAndUpdate(
      { _id: orderId },
      { isPaid: true, paidAt: new Date() },
      opts
    )
    if (!order) throw new Error('Order not found')

    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session)
      if (!product) throw new Error('Product not found')

      product.countInStock -= item.quantity
      await Product.updateOne(
        { _id: product._id },
        { countInStock: product.countInStock },
        opts
      )
    }
    await session.commitTransaction()
    session.endSession()
    return true
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    throw error
  }
}
export async function deliverOrder(orderId: string) {
  try {
    await requireAdmin()
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (!order.isPaid) throw new Error('Order is not paid')
    order.isDelivered = true
    order.deliveredAt = new Date()
    await order.save()
    if (order.user.email) await sendAskReviewOrderItems({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order delivered successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

// DELETE
export async function deleteOrder(id: string) {
  try {
    await requireAdmin()
    await connectToDatabase()
    const res = await Order.findByIdAndDelete(id)
    if (!res) throw new Error('Order not found')
    revalidatePath('/admin/orders')
    return {
      success: true,
      message: 'Order deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ALL ORDERS

export async function getAllOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  await requireAdmin()
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit
  const orders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await Order.countDocuments()
  return {
    data: JSON.parse(JSON.stringify(orders)) as IOrderList[],
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getMyOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const session = await auth()
  if (!session) {
    throw new Error('User is not authenticated')
  }
  const skipAmount = (Number(page) - 1) * limit
  const orders = await Order.find({
    user: session?.user?.id,
  })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await Order.countDocuments({ user: session?.user?.id })

  return {
    data: JSON.parse(JSON.stringify(orders)),
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getOrderById(orderId: string): Promise<IOrder> {
  await connectToDatabase()
  const order = await Order.findOne(await getOrderAccessFilter(orderId))
  return JSON.parse(JSON.stringify(order))
}

export async function createPayPalOrder(orderId: string) {
  await connectToDatabase()
  try {
    const order = await Order.findOne(await getOrderAccessFilter(orderId))
    if (order) {
      const paypalOrder = await paypal.createOrder(order.totalPrice)
      order.paymentResult = {
        id: paypalOrder.id,
        email_address: '',
        status: '',
        pricePaid: '0',
      }
      await order.save()
      return {
        success: true,
        message: 'PayPal order created successfully',
        data: paypalOrder.id,
      }
    } else {
      throw new Error('Order not found')
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string }
) {
  await connectToDatabase()
  try {
    const order = await Order.findOne(
      await getOrderAccessFilter(orderId)
    ).populate('user', 'email')
    if (!order) throw new Error('Order not found')

    const captureData = await paypal.capturePayment(data.orderID)
    if (
      !captureData ||
      captureData.id !== order.paymentResult?.id ||
      captureData.status !== 'COMPLETED'
    ) {
      throw new Error('Error in paypal payment')
    }

    const capturedAmount = Number(
      captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value
    )
    if (
      !Number.isFinite(capturedAmount) ||
      Math.abs(capturedAmount - order.totalPrice) > 0.01
    ) {
      throw new Error('Error in paypal payment')
    }
    order.isPaid = true
    order.paidAt = new Date()
    order.paymentResult = {
      id: captureData.id,
      status: captureData.status,
      email_address: captureData.payer.email_address,
      pricePaid:
        captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
    }
    await order.save()
    await sendPurchaseReceipt({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export const calcDeliveryDateAndPrice = async ({
  items,
  shippingAddress,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number
  items: OrderItem[]
  shippingAddress?: ShippingAddress
}) => {
  const { availableDeliveryDates } = await getSetting()
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  )

  const deliveryDate =
    availableDeliveryDates[
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex
    ]
  const shippingPrice =
    !shippingAddress || !deliveryDate
      ? undefined
      : shippingAddress.city === 'تهران'
        ? 0
        : deliveryDate.shippingPrice

  const taxPrice = 0
  const totalPrice = round2(
    itemsPrice + (shippingPrice ? round2(shippingPrice) : 0)
  )
  return {
    availableDeliveryDates,
    deliveryDateIndex:
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  }
}

// GET ORDERS BY USER
export async function getOrderSummary(date: DateRange) {
  await requireAdmin()
  await connectToDatabase()

  const ordersCount = await Order.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const productsCount = await Product.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const usersCount = await User.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })

  const totalSalesResult = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: null,
        sales: { $sum: '$totalPrice' },
      },
    },
    { $project: { totalSales: { $ifNull: ['$sales', 0] } } },
  ])
  const totalSales = totalSalesResult[0] ? totalSalesResult[0].totalSales : 0

  const today = new Date()
  const sixMonthEarlierDate = new Date(
    today.getFullYear(),
    today.getMonth() - 5,
    1
  )
  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: sixMonthEarlierDate,
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        label: '$_id',
        value: '$totalSales',
      },
    },

    { $sort: { label: -1 } },
  ])
  const topSalesCategories = await getTopSalesCategories(date)
  const topSalesProducts = await getTopSalesProducts(date)

  const {
    common: { pageSize },
  } = await getSetting()
  const limit = pageSize
  const latestOrders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    monthlySales: JSON.parse(JSON.stringify(monthlySales)),
    salesChartData: JSON.parse(JSON.stringify(await getSalesChartData(date))),
    topSalesCategories: JSON.parse(JSON.stringify(topSalesCategories)),
    topSalesProducts: JSON.parse(JSON.stringify(topSalesProducts)),
    latestOrders: JSON.parse(JSON.stringify(latestOrders)) as IOrderList[],
  }
}

async function getSalesChartData(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $concat: [
            { $toString: '$_id.year' },
            '/',
            { $toString: '$_id.month' },
            '/',
            { $toString: '$_id.day' },
          ],
        },
        totalSales: 1,
      },
    },
    { $sort: { date: 1 } },
  ])

  return result
}

async function getTopSalesProducts(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },

    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: {
          name: '$items.name',
          image: '$items.image',
          _id: '$items.product',
        },
        totalSales: {
          $sum: { $multiply: ['$items.quantity', '$items.price'] },
        }, // Assume quantity field in orderItems represents units sold
      },
    },
    {
      $sort: {
        totalSales: -1,
      },
    },
    { $limit: 6 },

    // Step 3: Replace productInfo array with product name and format the output
    {
      $project: {
        _id: 0,
        id: '$_id._id',
        label: '$_id.name',
        image: '$_id.image',
        value: '$totalSales',
      },
    },

    // Step 4: Sort by totalSales in descending order
    { $sort: { _id: 1 } },
  ])

  return result
}

async function getTopSalesCategories(date: DateRange, limit = 5) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },
    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: '$items.category',
        totalSales: { $sum: '$items.quantity' }, // Assume quantity field in orderItems represents units sold
      },
    },
    // Step 3: Sort by totalSales in descending order
    { $sort: { totalSales: -1 } },
    // Step 4: Limit to top N products
    { $limit: limit },
  ])

  return result
}
