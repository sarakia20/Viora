import type { Cart } from '@/types'
import { round2 } from './utils'

export const TIPAX_SHIPPING_METHOD = 'تیپاکس' as const
export const SHIPPING_PAY_ON_DELIVERY = 'پرداخت درب منزل'

export function isTipaxShipping(order: { shippingMethod?: string }) {
  return order.shippingMethod === TIPAX_SHIPPING_METHOD
}

export function calculateTipaxTotals(items: readonly { price: number; quantity: number }[]) {
  const itemsPrice = round2(items.reduce((total, item) => {
    if (!Number.isFinite(item.price) || item.price < 0 || !Number.isSafeInteger(item.quantity) || item.quantity < 1)
      throw new Error('قیمت یا تعداد کالا نامعتبر است')
    return total + item.price * item.quantity
  }, 0))
  // Tax is currently zero. Carrier charges are collected separately on delivery.
  const taxPrice = 0
  return {
    shippingMethod: TIPAX_SHIPPING_METHOD,
    itemsPrice,
    shippingPrice: 0,
    taxPrice,
    totalPrice: round2(itemsPrice + taxPrice),
    deliveryDateIndex: undefined,
    expectedDeliveryDate: undefined,
  }
}

// Normalize saved carts only; stored orders are never migrated or recalculated.
export function normalizeCartShipping(cart: Cart): Cart {
  return { ...cart, ...calculateTipaxTotals(cart.items) }
}
