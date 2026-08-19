export type CategoryConfig = {
  slug: string
  productCategory: string
  title: string
  description: string
  intro: string
}

export const categoryConfig = {
  sink: {
    slug: 'sink',
    productCategory: 'سینک',
    title: 'خرید سینک ظرفشویی | ویورا',
    description:
      'مدل‌های مختلف سینک ظرفشویی را با مشخصات، قیمت و وضعیت موجودی در فروشگاه ویورا مشاهده و مقایسه کنید.',
    intro:
      'در این صفحه می‌توانید مجموعه سینک‌های ظرفشویی موجود را بررسی کنید و با توجه به طراحی، مشخصات و فضای آشپزخانه خود انتخاب مناسب‌تری داشته باشید.',
  },
  faucets: {
    slug: 'faucets',
    productCategory: 'شیرآلات',
    title: 'خرید شیرآلات ساختمانی | ویورا',
    description:
      'انواع شیرآلات آشپزخانه، روشویی و حمام را با بررسی مشخصات، قیمت و موجودی در فروشگاه ویورا مقایسه کنید.',
    intro:
      'مجموعه شیرآلات ویورا برای فضاهای مختلف خانه گردآوری شده است. مدل‌ها را از نظر طراحی، کاربرد و مشخصات بررسی کنید و گزینه هماهنگ با نیاز خود را بیابید.',
  },
  toilet: {
    slug: 'toilet',
    productCategory: 'توالت فرنگی',
    title: 'خرید توالت فرنگی | ویورا',
    description:
      'مدل‌های توالت فرنگی را با اطلاعات محصول، قیمت و وضعیت موجودی در فروشگاه ویورا مشاهده و مقایسه کنید.',
    intro:
      'برای انتخاب توالت فرنگی، ابعاد، طراحی و تناسب آن با فضای سرویس بهداشتی اهمیت دارد. در این مجموعه می‌توانید مدل‌های موجود را کنار هم بررسی کنید.',
  },
  accessories: {
    slug: 'accessories',
    productCategory: 'اکسسوری',
    title: 'خرید اکسسوری سرویس بهداشتی | ویورا',
    description:
      'اکسسوری‌های کاربردی سرویس بهداشتی را با مشخصات، قیمت و وضعیت موجودی در فروشگاه ویورا بررسی کنید.',
    intro:
      'اکسسوری‌های مناسب، استفاده روزمره از حمام و سرویس بهداشتی را منظم‌تر و راحت‌تر می‌کنند. محصولات موجود را بر اساس کاربرد و طراحی مقایسه کنید.',
  },
} as const satisfies Record<string, CategoryConfig>

export type CategorySlug = keyof typeof categoryConfig

export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  return categoryConfig[slug as CategorySlug]
}
