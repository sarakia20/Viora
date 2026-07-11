import { Data, IProductInput, IUserInput } from '@/types'
import { toSlug } from './utils'
import bcrypt from 'bcryptjs'
import { i18n } from '@/i18n-config'

const users: IUserInput[] = [
  {
    name: 'John',
     phone: '09300245140',
    email: 'admin@example.com',
    password: bcrypt.hashSync('123456', 5),
    role: 'Admin',
    address: {
      fullName: 'John Doe',
      street: '111 Main St',
      city: 'New York',
      province: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '09300245140',
    },
    paymentMethod: 'Stripe',
    emailVerified: false,
  },
  
  
  
]

const products: IProductInput[] = [
  
  {
  name: 'فلاش تانک سارودی مدل کاسپین کروم',
  slug: toSlug('فلاش تانک سارودی مدل کاسپین کروم'),
  category: 'فلاش تانک',
  brand: 'Sarodi',
  images: [
    '/images/FT3.png',
    
  ],
  tags: ['new-arrival'],
  isPublished: true,

  price: 2850000,
  listPrice: 3200000,

  avgRating: 5,
  numReviews: 0,

  ratingDistribution: [
    { rating: 1, count: 0 },
    { rating: 2, count: 0 },
    { rating: 3, count: 0 },
    { rating: 4, count: 0 },
    { rating: 5, count: 0 },
  ],

  countInStock: 20,
  numSales: 0,

  description:
    ' سیستم پمپ قابل تنظیم میزان خروجی در جهت کاهش مصرف آب,مجهز به لوله و اتصالات جدید با قابلیت نصب تنها در 5 دقیقه,مجهز به سه حالت تخلیه کششی و شاسی دو زمانه,اولین فلاش تانک دوزمانه ی کششی فشاری دنیا,مجهز به فلوتر (شناور) دیافراگمی بـی صـدا,حجم خروجی آب 2 تا 8 لیتر (قابل تنظیم),سرعت خروجی آب 2 لیتر بر ثانیه,دارای مخزن فوق باریک,',

  sizes: [],
  colors: ['مشکی'],

  reviews: [],
},


  
  {
  name:' فلاش تانک سارودی مدل کاسپین طلامات',
  "slug": "flash-tank-sarodi-caspian-gold",
  category: 'فلاش تانک',
  brand: 'Sarodi',
  images: [
    '/images/FT2.png',
    
  ],
  tags: ['new-arrival'],
  isPublished: true,

  price: 2850000,
  listPrice: 3200000,

  avgRating: 5,
  numReviews: 0,

  ratingDistribution: [
    { rating: 1, count: 0 },
    { rating: 2, count: 0 },
    { rating: 3, count: 0 },
    { rating: 4, count: 0 },
    { rating: 5, count: 0 },
  ],

  countInStock: 20,
  numSales: 0,

  "description": "فلاش تانک سارودی مدل کاسپین طلامات با طراحی مدرن و مخزن فوق باریک، انتخابی ایده‌آل برای سرویس‌های بهداشتی امروزی است. سیستم پمپ قابل تنظیم جهت کاهش مصرف آب، مجهز به لوله و اتصالات جدید با قابلیت نصب در کمتر از ۵ دقیقه، دارای سه حالت تخلیه کششی، فشاری و شاسی دو زمانه، مجهز به فلوتر دیافراگمی بی‌صدا، حجم خروجی آب قابل تنظیم از ۲ تا ۸ لیتر، سرعت خروجی آب ۲ لیتر بر ثانیه و کیفیت ساخت بالا.",

  sizes: [],
  colors: ['طلامات'],

  reviews: [],
},
  
]
const reviews = [
  {
    rating: 1,
    title: 'Poor quality',
    comment:
      'Very disappointed. The item broke after just a few uses. Not worth the money.',
  },
  {
    rating: 2,
    title: 'Disappointed',
    comment:
      "Not as expected. The material feels cheap, and it didn't fit well. Wouldn't buy again.",
  },
  {
    rating: 2,
    title: 'Needs improvement',
    comment:
      "It looks nice but doesn't perform as expected. Wouldn't recommend without upgrades.",
  },
  {
    rating: 3,
    title: 'not bad',
    comment:
      'This product is decent, the quality is good but it could use some improvements in the details.',
  },
  {
    rating: 3,
    title: 'Okay, not great',
    comment:
      'It works, but not as well as I hoped. Quality is average and lacks some finishing.',
  },
  {
    rating: 3,
    title: 'Good product',
    comment:
      'This product is amazing, I love it! The quality is top notch, the material is comfortable and breathable.',
  },
  {
    rating: 4,
    title: 'Pretty good',
    comment:
      "Solid product! Great value for the price, but there's room for minor improvements.",
  },
  {
    rating: 4,
    title: 'Very satisfied',
    comment:
      'Good product! High quality and worth the price. Would consider buying again.',
  },
  {
    rating: 4,
    title: 'Absolutely love it!',
    comment:
      'Perfect in every way! The quality, design, and comfort exceeded all my expectations.',
  },
  {
    rating: 4,
    title: 'Exceeded expectations!',
    comment:
      'Fantastic product! High quality, feels durable, and performs well. Highly recommend!',
  },
  {
    rating: 5,
    title: 'Perfect purchase!',
    comment:
      "Couldn't be happier with this product. The quality is excellent, and it works flawlessly!",
  },
  {
    rating: 5,
    title: 'کاملاً پیشنهاد می‌کنم',
    comment:
      "محصول فوق‌العاده‌ایه! کاملاً ارزش خرید داره، طراحی عالی و حس بسیار باکیفیتی داره. کاملاً راضی هستم.",
  },
  {
    rating: 5,
    title: 'دقیقاً همونی بود که می‌خواستم',
    comment:
      'دقیقاً مطابق توضیحات بود! کیفیتش حتی از انتظارم هم بهتر بود و خیلی سریع به دستم رسید.',
  },
  {
    rating: 5,
    title: 'انتخاب عالی!',
    comment:
      'این محصول واقعاً بی‌نظیره! از جنس و کیفیت ساخت گرفته تا عملکردش، همه چیز در سطح بالاست.',
  },
  {
    rating: 5,
    title: "همه چیز عالی بود",
    comment:
      "خیلی از این محصول راضیم! هم بادوامه، هم ظاهر شیکی داره و هم عملکردش عالیه. بدون شک دوباره می‌خرم.",
  },
]

const data: Data = {
  users,
  products,
  reviews,
  webPages: [
    {
      title: 'درباره ما',
      slug: 'about-us',
      content: `به فروشگاه [نام فروشگاه شما] خوش آمدید؛ مقصدی مطمئن برای خرید محصولات باکیفیت و دریافت خدماتی حرفه‌ای.

ما با هدف ایجاد یک تجربه خرید ساده، سریع و قابل اعتماد فعالیت خود را آغاز کردیم. تلاش ما این است که مجموعه‌ای متنوع از محصولات را با قیمت‌های رقابتی و در یک پلتفرم یکپارچه در اختیار شما قرار دهیم.

در [نام فروشگاه شما] رضایت مشتری در اولویت ماست. تیم ما به‌صورت مستمر در حال انتخاب و ارائه بهترین کالاهاست؛ از نیازهای روزمره گرفته تا پیشنهادهای ویژه و محصولات خاص.

همچنین تلاش می‌کنیم تجربه خرید شما بدون دردسر باشد؛ با ارسال سریع، پرداخت امن و پشتیبانی پاسخگو در کنار شما هستیم.

با رشد ما، تعهد ما به کیفیت و خدمات بهتر نیز بیشتر می‌شود.  
از اینکه [نام فروشگاه شما] را انتخاب کرده‌اید سپاسگزاریم و خوشحالیم که در مسیر خرید آنلاین همراه شما هستیم.`,
      isPublished: true,
    },
    {
      title: 'تماس با ما',
      slug: 'contact-us',
      content: `ما اینجاییم تا به شما کمک کنیم!

اگر سوال، پیشنهاد یا مشکلی دارید، تیم ما آماده پاسخگویی به شماست تا بهترین تجربه خرید را برایتان فراهم کنیم.

**پشتیبانی مشتریان**  
برای پیگیری سفارش‌ها، سوال درباره محصولات یا مشکلات حساب کاربری با ما در تماس باشید:
- **ایمیل:** support@example.com  
- **تلفن:** ۰۲۱-۱۲۳۴۵۶۷۸  
- **چت آنلاین:** از طریق وب‌سایت، شنبه تا پنج‌شنبه از ساعت ۹ صبح تا ۶ عصر

**دفتر مرکزی**  
برای همکاری‌های تجاری یا امور سازمانی:
- **آدرس:** تهران، خیابان نمونه، پلاک ۱۲۳  
- **تلفن:** ۰۲۱-۸۷۶۵۴۳۲۱ 

رضایت شما اولویت ماست و با افتخار پاسخگوی شما هستیم.
`,
      isPublished: true,
    },
    
    {
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      content: `We value your privacy and are committed to protecting your personal information. This Privacy Notice explains how we collect, use, and share your data when you interact with our services. By using our platform, you consent to the practices described herein.

We collect data such as your name, email address, and payment details to provide you with tailored services and improve your experience. This information may also be used for marketing purposes, but only with your consent. Additionally, we may share your data with trusted third-party providers to facilitate transactions or deliver products.

Your data is safeguarded through robust security measures to prevent unauthorized access. However, you have the right to access, correct, or delete your personal information at any time. For inquiries or concerns regarding your privacy, please contact our support team.`,
      isPublished: true,
    },
    {
      title: 'Conditions of Use',
      slug: 'conditions-of-use',
      content: `Welcome to [Ecommerce Website Name]. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions. These terms govern your use of our platform, including browsing, purchasing products, and interacting with any content or services provided. You must be at least 18 years old or have the consent of a parent or guardian to use this website. Any breach of these terms may result in the termination of your access to our platform.

We strive to ensure all product descriptions, pricing, and availability information on our website are accurate. However, errors may occur, and we reserve the right to correct them without prior notice. All purchases are subject to our return and refund policy. By using our site, you acknowledge that your personal information will be processed according to our privacy policy, ensuring your data is handled securely and responsibly. Please review these terms carefully before proceeding with any transactions.
`,
      isPublished: true,
    },
    {
      title: 'Customer Service',
      slug: 'customer-service',
      content: `At [Your Store Name], our customer service team is here to ensure you have the best shopping experience. Whether you need assistance with orders, product details, or returns, we are committed to providing prompt and helpful support.

If you have questions or concerns, please reach out to us through our multiple contact options:
- **Email:** support@example.com
- **Phone:** +1 (123) 456-7890
- **Live Chat:** Available on our website for instant assistance

We also provide helpful resources such as order tracking, product guides, and FAQs to assist you with common inquiries. Your satisfaction is our priority, and we’re here to resolve any issues quickly and efficiently. Thank you for choosing us!`,
      isPublished: true,
    },
    {
      title: 'Returns Policy',
      slug: 'returns-policy',
      content: 'Returns Policy Content',
      isPublished: true,
    },
    {
      title: 'Careers',
      slug: 'careers',
      content: 'careers Content',
      isPublished: true,
    },
    {
      title: 'Blog',
      slug: 'blog',
      content: 'Blog Content',
      isPublished: true,
    },
    {
      title: 'Sell Products',
      slug: 'sell',
      content: `Sell Products Content`,
      isPublished: true,
    },
    {
      title: 'Become Affiliate',
      slug: 'become-affiliate',
      content: 'Become Affiliate Content',
      isPublished: true,
    },
    {
      title: 'Advertise Your Products',
      slug: 'advertise',
      content: 'Advertise Your Products',
      isPublished: true,
    },
    {
      title: 'Shipping Rates & Policies',
      slug: 'shipping',
      content: 'Shipping Rates & Policies',
      isPublished: true,
    },
  ],
  headerMenus: [
  {
    name: "Today's Deal",
    href: '/search?tag=todays-deal',
  },
  {
    name: 'New Arrivals',
    href: '/search?tag=new-arrival',
  },
  {
    name: 'Featured Products',
    href: '/search?tag=featured',
  },
  {
    name: 'Best Sellers',
    href: '/search?tag=best-seller',
  },
  {
    name: 'About Us',
    href: '/page/about-us',
  },
],
  carousels: [
    {
      title: 'Most Popular Shoes For Sale',
      buttonCaption: 'Shop Now',
      image: '/images/banner3.jpg',
      url: '/search?category=Shoes',
      isPublished: true,
    },
    {
      title: 'Best Sellers in T-Shirts',
      buttonCaption: 'Shop Now',
      image: '/images/banner1.jpg',
      url: '/search?category=T-Shirts',
      isPublished: true,
    },
    {
      title: 'Best Deals on Wrist Watches',
      buttonCaption: 'See More',
      image: '/images/banner-bathroom.jpg',
      url: '/search?category=Wrist Watches',
      isPublished: true,
    },
  ],
  settings: [
    {
      common: {
        freeShippingMinPrice: 35,
        isMaintenanceMode: false,
        defaultTheme: 'Light',
        defaultColor: 'Gold',
        pageSize: 9,
      },
      site: {
        name: 'NxtAmzn',
        description:
          'NxtAmzn is a sample Ecommerce website built with Next.js, Tailwind CSS, and MongoDB.',
        keywords: 'Next Ecommerce, Next.js, Tailwind CSS, MongoDB',
        url: 'https://next-mongo-ecommerce-final.vercel.app',
        logo: '/icons/logo.svg',
       
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
    },
  ],
}

export default data
