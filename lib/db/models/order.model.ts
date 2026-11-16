import { IOrderInput } from '@/types'
import { Document, Model, model, models, Schema } from 'mongoose'
import { TIPAX_SHIPPING_METHOD } from '@/lib/shipping'

export interface IOrder extends Document, IOrderInput {
  paymentAuthority?: string
  paymentRefId?: string
  paymentRequestId?: string
  paymentRequestAt?: Date
 
  createdAt: Date
  updatedAt: Date
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId as unknown as typeof String,
      ref: 'User',
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        clientId: { type: String, required: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        image: { type: String, required: true },
        category: { type: String, required: true },
        price: { type: Number, required: true },
        countInStock: { type: Number, required: true },
        quantity: { type: Number, required: true },
        size: { type: String },
        color: { type: String },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      province: { type: String, required: true },
      phone: { type: String, required: true },
    },
    shippingMethod: { type: String, enum: [TIPAX_SHIPPING_METHOD] },
    expectedDeliveryDate: {
      type: Date,
      required: function (this: IOrder) { return this.shippingMethod !== TIPAX_SHIPPING_METHOD },
    },
    paymentMethod: { type: String, required: true },
    paymentResult: { id: String, status: String, email_address: String },
    paymentAuthority: { type: String, index: true },
    paymentRefId: { type: String, index: true },
    paymentRequestId: { type: String },
    paymentRequestAt: { type: Date },
    itemsPrice: { type: Number, required: true },
    shippingPrice: {
      type: Number,
      required: true,
      validate: {
        validator: function (this: IOrder, value: number) {
          return this.shippingMethod !== TIPAX_SHIPPING_METHOD || value === 0
        },
        message: 'هزینه ارسال آنلاین تیپاکس باید صفر باشد',
      },
    },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
)

const Order =
  (models.Order as Model<IOrder>) || model<IOrder>('Order', orderSchema)

export default Order
