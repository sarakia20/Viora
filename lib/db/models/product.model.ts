import { Document, Model, model, models, Schema } from 'mongoose'
import { IProductInput } from '@/types'

export interface IProduct extends Document, IProductInput {
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    category: {
      type: String,
      required: true,
    },

    // زیرمجموعه محصول
    // مثال برای سینک:
    // گرانیتی، استیل توکار، سینک های دست ساز
    subCategory: {
      type: String,
      required: false,
    },

    images: [String],

    brand: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    listPrice: {
      type: Number,
      required: true,
    },

    countInStock: {
      type: Number,
      required: true,
    },

    tags: {
      type: [String],
      default: ['new arrival'],
    },

    colors: {
      type: [String],
      default: ['White', 'Red', 'Black'],
    },

    variants: [
      {
        color: String,
        image: String,
        price: Number,
        listPrice: Number,
        countInStock: Number,
        _id: false,
      },
    ],

    sizes: {
      type: [String],
      default: ['S', 'M', 'L'],
    },

    avgRating: {
      type: Number,
      required: true,
      default: 0,
    },

    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },

    ratingDistribution: [
      {
        rating: {
          type: Number,
          required: true,
        },
        count: {
          type: Number,
          required: true,
        },
      },
    ],

    numSales: {
      type: Number,
      required: true,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },

    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
)

const Product =
  (models.Product as Model<IProduct>) ||
  model<IProduct>('Product', productSchema)

export default Product
