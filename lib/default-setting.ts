import { i18n } from '@/i18n-config'
import type { ISettingInput } from '@/types'

export const defaultSetting: ISettingInput = {
  common: {
    freeShippingMinPrice: 35,
    isMaintenanceMode: false,
    defaultTheme: 'Light',
    defaultColor: 'Gold',
    pageSize: 9,
  },
  site: {
    name: 'Viora',
    description:
      'NxtAmzn is a sample Ecommerce website built with Next.js, Tailwind CSS, and MongoDB.',
    keywords: 'Next Ecommerce, Next.js, Tailwind CSS, MongoDB',
    url: 'https://next-mongo-ecommerce-final.vercel.app',
    logo: '/icons/viora-logo.png',
    slogan: '',
    author: 'Next Ecommerce',
    copyright: '2000-2024, Next-Ecommerce.com, Inc. or its affiliates',
    email: 'admin@example.com',
    address: '123, Main Street, Anytown, CA, Zip 12345',
    phone: '+1 (123) 456-7890',
  },
  carousels: [
    {
      title: 'شیرآلات ',
      buttonCaption: 'مشاهده محصولات',
      image: '/images/banner-faucet.jpg',
      url: '/search?category=شیرآلات',
    },
    {
      title: 'تجهیزات آشپزخانه',
      buttonCaption: 'مشاهده محصولات',
      image: '/images/banner-kitchen.jpg',
      url: '/search?category=هود',
    },
    {
      title: 'چینی آلات بهداشتی',
      buttonCaption: 'مشاهده محصولات',
      image: '/images/banner-bathroom.jpg',
      url: '/search?category=روشویی',
    },
  ],
  availableLanguages: i18n.locales.map((locale) => ({
    code: locale.code,
    name: locale.name,
  })),
  defaultLanguage: 'fa',
  availableCurrencies: [
    {
      name: 'United States Dollar',
      code: 'USD',
      symbol: '$',
      convertRate: 1,
    },
    { name: 'Euro', code: 'EUR', symbol: '€', convertRate: 0.96 },
    { name: 'UAE Dirham', code: 'AED', symbol: 'AED', convertRate: 3.67 },
    { name: 'Iranian Toman', code: 'IRT', symbol: 'تومان', convertRate: 42000 },
  ],
  defaultCurrency: 'IRT',
  availablePaymentMethods: [
    { name: 'ZarinPal', commission: 0 },
    { name: 'PayPal', commission: 0 },
    { name: 'Stripe', commission: 0 },
    { name: 'Cash On Delivery', commission: 0 },
  ],
  defaultPaymentMethod: 'PayPal',
  availableDeliveryDates: [
    {
      name: 'Tomorrow',
      daysToDeliver: 1,
      shippingPrice: 12.9,
      freeShippingMinPrice: 0,
    },
    {
      name: 'Next 3 Days',
      daysToDeliver: 3,
      shippingPrice: 6.9,
      freeShippingMinPrice: 0,
    },
    {
      name: 'Next 5 Days',
      daysToDeliver: 5,
      shippingPrice: 4.9,
      freeShippingMinPrice: 35,
    },
  ],
  defaultDeliveryDate: 'Next 5 Days',
}
