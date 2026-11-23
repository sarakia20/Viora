import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions'
import { normalizeCartShipping, TIPAX_SHIPPING_METHOD } from '@/lib/shipping'
import { ShippingAddressSchema } from '@/lib/validator'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: 0,
  shippingPrice: 0,
  shippingMethod: TIPAX_SHIPPING_METHOD,
  totalPrice: 0,
  paymentMethod: undefined,
  shippingAddress: undefined,
  deliveryDateIndex: undefined,
}

interface CartState {
  cart: Cart
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => void
  clearCart: () => void
  setShippingAddress: (shippingAddress: ShippingAddress) => Promise<void>
  setPaymentMethod: (paymentMethod: string) => void
  getCheckoutRequestId: () => string
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,

      addItem: async (item: OrderItem, quantity: number) => {
        const { items, shippingAddress } = get().cart
        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (existItem) {
          if (item.countInStock < quantity + existItem.quantity) {
            throw new Error('Not enough items in stock')
          }
        } else {
          if (item.countInStock < quantity) {
            throw new Error('Not enough items in stock')
          }
        }

        const updatedCartItems = existItem
          ? items.map((x) =>
              x.product === item.product &&
              x.color === item.color &&
              x.size === item.size
                ? { ...item, clientId: existItem.clientId, quantity: existItem.quantity + quantity }
                : x
            )
          : [...items, { ...item, quantity }]

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            checkoutRequestId: undefined,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
              shippingAddress,
            })),
          },
        })
        const foundItem = updatedCartItems.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!foundItem) {
          throw new Error('Item not found in cart')
        }
        return foundItem.clientId
      },
      updateItem: async (item: OrderItem, quantity: number) => {
        const { items, shippingAddress } = get().cart
        const exist = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!exist) return
        const updatedCartItems = items.map((x) =>
          x.product === item.product &&
          x.color === item.color &&
          x.size === item.size
            ? { ...exist, quantity: quantity }
            : x
        )
        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            checkoutRequestId: undefined,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
              shippingAddress,
            })),
          },
        })
      },
      removeItem: async (item: OrderItem) => {
        const { items, shippingAddress } = get().cart
        const updatedCartItems = items.filter(
          (x) =>
            x.product !== item.product ||
            x.color !== item.color ||
            x.size !== item.size
        )
        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            checkoutRequestId: undefined,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
              shippingAddress,
            })),
          },
        })
      },
      setShippingAddress: async (shippingAddress: ShippingAddress) => {
        const validatedAddress = ShippingAddressSchema.parse(shippingAddress)
        const { items } = get().cart
        const unchanged = Object.entries(validatedAddress).every(
          ([key, value]) => get().cart.shippingAddress?.[key as keyof ShippingAddress] === value
        )
        set({
          cart: {
            ...get().cart,
            shippingAddress: validatedAddress,
            checkoutRequestId: unchanged ? get().cart.checkoutRequestId : undefined,
            ...(await calcDeliveryDateAndPrice({
              items,
              shippingAddress: validatedAddress,
            })),
          },
        })
      },
      setPaymentMethod: (paymentMethod: string) => {
        set({
          cart: {
            ...get().cart,
            paymentMethod,
            checkoutRequestId: paymentMethod === get().cart.paymentMethod ? get().cart.checkoutRequestId : undefined,
          },
        })
      },
      getCheckoutRequestId: () => {
        const current = get().cart.checkoutRequestId
        if (current && /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(current)) return current
        const requestId = crypto.randomUUID()
        set({ cart: { ...get().cart, checkoutRequestId: requestId } })
        return requestId
      },
      clearCart: () => {
        set({
          cart: normalizeCartShipping({
            ...get().cart,
            items: [],
            checkoutRequestId: undefined,
          }),
        })
      },
      init: () => set({ cart: initialState }),
    }),

    {
      name: 'cart-store',
      merge: (persisted, current) => ({
        ...current,
        cart: normalizeCartShipping({ ...current.cart, ...(persisted as Partial<CartState>)?.cart }),
      }),
    }
  )
)
export default useCartStore
