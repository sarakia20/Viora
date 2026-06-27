import { z } from 'zod'
import { formatNumberWithDecimal } from './utils'

// Common
const MongoId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid MongoDB ID' })

const Price = (field: string) =>
  z.coerce
    .number()
    .refine(
      (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(value)),
      `${field} must have exactly two decimal places (e.g., 49.99)`
    )

export const ReviewInputSchema = z.object({
  product: MongoId,
  user: MongoId,
  isVerifiedPurchase: z.boolean(),
  title: z.string().min(1, 'عنوان الزامی است'),
  comment: z.string().min(1, 'نظر الزامی است'),
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
})

export const ProductInputSchema = z.object({
  name: z.string().min(3, 'نام باید حداقل 3 کاراکتر باشد'),
  slug: z.string().min(3, 'اسلاگ باید حداقل 3 کاراکتر باشد'),
  category: z.string().min(1, 'دسته‌بندی الزامی است'),
  images: z.array(z.string()).min(1, 'محصول باید حداقل یک تصویر داشته باشد'),
  brand: z.string().min(1, 'برند الزامی است'),
  description: z.string().min(1, 'توضیحات الزامی است'),
  isPublished: z.boolean(),
  price: Price('Price'),
  listPrice: Price('List price'),
  countInStock: z.coerce
    .number()
    .int()
    .nonnegative('موجودی باید عدد صفر یا بیشتر باشد'),
  tags: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  avgRating: z.coerce
    .number()
    .min(0, 'Average rating must be at least 0')
    .max(5, 'Average rating must be at most 5'),
  numReviews: z.coerce
    .number()
    .int()
    .nonnegative('تعداد نظرات باید عدد مثبت باشد'),
  ratingDistribution: z
    .array(z.object({ rating: z.number(), count: z.number() }))
    .max(5),
  reviews: z.array(ReviewInputSchema).default([]),
  numSales: z.coerce
    .number()
    .int()
    .nonnegative('تعداد فروش باید عدد مثبت باشد'),
})

export const ProductUpdateSchema = ProductInputSchema.extend({
  _id: z.string(),
})

// Order Item
export const OrderItemSchema = z.object({
  clientId: z.string().min(1, 'شناسه کاربر الزامی است'),
  product: z.string().min(1, 'محصول الزامی است'),
  name: z.string().min(1, 'نام الزامی است'),
  slug: z.string().min(1, 'اسلاگ الزامی است'),
  category: z.string().min(1, 'دسته‌بندی الزامی است'),
  quantity: z
    .number()
    .int()
    .nonnegative('تعداد باید صفر یا بیشتر باشد'),
  countInStock: z
    .number()
    .int()
    .nonnegative('موجودی باید صفر یا بیشتر باشد'),
  image: z.string().min(1, 'تصویر الزامی است'),
  price: Price('قیمت معتبر نیست'),
  size: z.string().optional(),
  color: z.string().optional(),
})
export const ShippingAddressSchema = z.object({
  fullName: z.string().min(1, 'نام و نام خانوادگی الزامی است'),
  street: z.string().min(1, 'آدرس الزامی است'),
  city: z.string().min(1, 'شهر الزامی است'),
  postalCode: z.string().min(1, 'کد پستی الزامی است'),
  province: z.string().min(1, 'استان الزامی است'),
  phone: z.string().min(1, 'شماره موبایل الزامی است'),
  country: z.string().min(1, 'کشور الزامی است'),
})

// Order
export const OrderInputSchema = z.object({
  user: z.union([
    MongoId,
    z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  ]),
  items: z
    .array(OrderItemSchema)
    .min(1, 'سبد خرید نباید خالی باشد'),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: z.string().min(1, 'روش پرداخت الزامی است'),
  paymentResult: z
    .object({
      id: z.string(),
      status: z.string(),
      email_address: z.string(),
      pricePaid: z.string(),
    })
    .optional(),
  itemsPrice: Price('قیمت محصولات نامعتبر است'),
  shippingPrice: Price('هزینه ارسال نامعتبر است'),
  taxPrice: Price('مالیات نامعتبر است'),
  totalPrice: Price('جمع کل نامعتبر است'),
  expectedDeliveryDate: z
    .date()
    .refine(
      (value) => value > new Date(),
      'تاریخ تحویل باید در آینده باشد'
    ),
  isDelivered: z.boolean().default(false),
  deliveredAt: z.date().optional(),
  isPaid: z.boolean().default(false),
  paidAt: z.date().optional(),
})
// Cart

export const CartSchema = z.object({
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must contain at least one item'),
  itemsPrice: z.number(),
  taxPrice: z.optional(z.number()),
  shippingPrice: z.optional(z.number()),
  totalPrice: z.number(),
  paymentMethod: z.optional(z.string()),
  shippingAddress: z.optional(ShippingAddressSchema),
  deliveryDateIndex: z.optional(z.number()),
  expectedDeliveryDate: z.optional(z.date()),
})

const Phone = z
  .string()
  .min(11, 'شماره موبایل معتبر نیست')
// USER
const UserName = z
  .string()
  .min(2, { message: 'نام کاربری باید حداقل 2 کاراکتر باشد' })
  .max(50, { message: 'Username must be at most 30 characters' })
const Email = z.string().email().optional()
const Password = z.string().min(3, 'رمز عبور باید حداقل 3 کاراکتر باشد')
const UserRole = z.string().min(1, 'نقش کاربر الزامی است')

export const UserUpdateSchema = z.object({
  _id: MongoId,
  name: UserName,
  phone: Phone,
  email: Email,
  role: UserRole,
})

export const UserInputSchema = z.object({
  name: UserName,
  phone: Phone,
  email: Email,
  image: z.string().optional(),
  emailVerified: z.boolean(),
  role: UserRole,
  password: Password,
  paymentMethod: z.string().min(1, 'Payment method is required'),
  address: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    phone: z.string().min(1, 'Phone number is required'),
  }),
})

export const UserSignInSchema = z.object({
  phone: Phone,
 
  password: Password,
})
export const UserSignUpSchema = UserSignInSchema.extend({
  name: UserName,
  confirmPassword: Password,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],

})
export const UserNameSchema = z.object({
  name: UserName,
})

// WEBPAGE
export const WebPageInputSchema = z.object({
  title: z.string().min(3, 'عنوان باید حداقل 3 کاراکتر باشد'),
  slug: z.string().min(3, 'اسلاگ باید حداقل 3 کاراکتر باشد'),
  content: z.string().min(1, 'محتوا الزامی است'),
  isPublished: z.boolean(),
})

export const WebPageUpdateSchema = WebPageInputSchema.extend({
  _id: z.string(),
})

// Setting

export const SiteLanguageSchema = z.object({
  name: z.string().min(1, 'نام الزامی است'),
  code: z.string().min(1, 'کد زبان الزامی است'),
})
export const CarouselSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  url: z.string().min(1, 'آدرس سایت الزامی است'),
  image: z.string().min(1, 'تصویر الزامی است'),
  buttonCaption: z.string().min(1, 'متن دکمه الزامی است'),
})

export const SiteCurrencySchema = z.object({
  name: z.string().min(1, 'نام ارز الزامی است'),
  code: z.string().min(1, 'کد ارز الزامی است'),
  convertRate: z.coerce.number().min(0, 'نرخ تبدیل باید 0 یا بیشتر باشد'),
  symbol: z.string().min(1, 'نماد ارز الزامی است'),
})

export const PaymentMethodSchema = z.object({
  name: z.string().min(1, 'نام روش پرداخت الزامی است'),
  commission: z.coerce.number().min(0, 'کارمزد باید 0 یا بیشتر باشد'),
})

export const DeliveryDateSchema = z.object({
  name: z.string().min(1, 'نام زمان ارسال الزامی است'),
  daysToDeliver: z.number().min(0, 'روزهای ارسال باید 0 یا بیشتر باشد'),
  shippingPrice: z.coerce.number().min(0, 'هزینه ارسال باید 0 یا بیشتر باشد'),
  freeShippingMinPrice: z.coerce
    .number()
    .min(0, 'حداقل مبلغ ارسال رایگان باید 0 یا بیشتر باشد'),
})

export const SettingInputSchema = z.object({
  // PROMPT: create fields
  // codeium, based on the mongoose schema for settings
  common: z.object({
    pageSize: z.coerce
      .number()
      .min(1, 'حداقل تعداد صفحه باید 1 باشد')
      .default(9),
    isMaintenanceMode: z.boolean().default(false),
    freeShippingMinPrice: z.coerce
      .number()
      .min(0, 'حداقل مبلغ ارسال رایگان باید 0 یا بیشتر باشد')
      .default(0),
    defaultTheme: z
      .string()
      .min(1, 'انتخاب تم پیش‌فرض الزامی است')
      .default('light'),
    defaultColor: z
      .string()
      .min(1, 'انتخاب رنگ پیش‌فرض الزامی است')
      .default('gold'),
  }),
  site: z.object({
    name: z.string().min(1, 'نام الزامی است'),
    logo: z.string().min(1, 'لوگو الزامی است'),
    slogan: z.string().min(1, 'شعار الزامی است'),
    description: z.string().min(1, 'توضیحات الزامی است'),
    keywords: z.string().min(1, 'کلمات کلیدی الزامی است'),
    url: z.string().min(1, 'آدرس سایت الزامی است'),
    email: z.string().min(1, 'ایمیل الزامی است'),
    phone: z.string().min(1, 'شماره تلفن الزامی است'),
    author: z.string().min(1, 'نویسنده الزامی است'),
    copyright: z.string().min(1, 'کپی‌رایت الزامی است'),
    address: z.string().min(1, 'آدرس الزامی است'),
  }),
  availableLanguages: z
    .array(SiteLanguageSchema)
    .min(1, 'At least one language is required'),

  carousels: z
    .array(CarouselSchema)
    .min(1, 'حداقل یک اسلاید ضروری است'),
  defaultLanguage: z.string().min(1, 'زبان الزامی است'),
  availableCurrencies: z
    .array(SiteCurrencySchema)
    .min(1, 'حداقل یک ارز باید تعریف شود '),
  defaultCurrency: z.string().min(1, 'ارز پیش‌فرض الزامی است'),
  availablePaymentMethods: z
    .array(PaymentMethodSchema)
    .min(1, 'حداقل یک روش پرداخت باید تعریف شود'),
  defaultPaymentMethod: z.string().min(1, 'روش پرداخت پیش‌فرض الزامی است'),
  availableDeliveryDates: z
    .array(DeliveryDateSchema)
    .min(1, 'حداقل یک زمان ارسال باید تعریف شود'),
  defaultDeliveryDate: z.string().min(1, 'زمان ارسال پیش‌فرض الزامی است'),
})
