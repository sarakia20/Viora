import { STORE_NAME } from './store-brand'
import { getCategoryLandingPath } from './category-config'

export type CatalogProduct = {
  slug: string
  name?: string
  brand?: string
  category: string
  subCategory?: string
}

const flushTankCategory = 'فلاش تانک'
const concealedTanks = 'فلاش تانک توکار'
const flushPlates = 'صفحه کلید فلاش تانک توکار'
const flushPlateName = /صفحه[\s‌]+کلید/

type Collection = {
  slug: string
  label: string
  category: string
  subCategory?: string
  nameMatch?: RegExp
  description: string
  guide: string
}

// The selectors use recorded category names, or words verified in recorded product names.
export const collections: readonly Collection[] = [
  {
    slug: 'kitchen-faucets', label: 'شیر ظرفشویی', category: 'شیرآلات', subCategory: 'شیر آشپزخانه',
    description: `مدل‌های شیر ظرفشویی ${STORE_NAME} را از نظر فرم آبریز، شیوه نصب و رنگ‌های قابل انتخاب مقایسه کنید.`,
    guide: 'ارتفاع آبریز را با عمق سینک و فضای بالای آن تطبیق دهید. برای شست‌وشوی ظروف بزرگ، فاصله آبریز تا لگن مهم‌تر از ارتفاع کلی شیر است.',
  },
  {
    slug: 'pull-out-kitchen-faucets', label: 'شیر ظرفشویی شاوری', category: 'شیرآلات', subCategory: 'شیر آشپزخانه', nameMatch: /شاوری/,
    description: 'مدل‌های شیر ظرفشویی شاوری را با توجه به دسترسی به لگن، شکل سردوش و فضای نصب بررسی کنید.',
    guide: 'پیش از خرید فضای حرکت شلنگ را زیر سینک بررسی کنید. مسیر شلنگ باید از سطل زباله، سیفون و سایر موانع فاصله داشته باشد.',
  },
  {
    slug: 'dual-purpose-kitchen-faucets', label: 'شیر ظرفشویی دومنظوره', category: 'شیرآلات', subCategory: 'شیر آشپزخانه', nameMatch: /دو[\s‌]*منظوره/,
    description: `شیرهای ظرفشویی دومنظوره ثبت‌شده در ${STORE_NAME} را از نظر خروجی‌ها، نوع کنترل و شرایط اتصال مقایسه کنید.`,
    guide: 'پیش از سفارش، مشخصات مسیر آب و نوع اتصالات همان مدل را با لوله‌کشی و تجهیزات زیر سینک مقایسه کنید.',
  },
  {
    slug: 'one-piece-toilets', label: 'توالت فرنگی یک‌تکه', category: 'توالت فرنگی', subCategory: 'توالت فرنگی یک تکه',
    description: `توالت‌های فرنگی یک‌تکه ${STORE_NAME} را با توجه به ابعاد فضا، خروجی فاضلاب و گزینه‌های ثبت‌شده مقایسه کنید.`,
    guide: 'فاصله مرکز خروجی فاضلاب تا دیوار و فضای لازم برای باز شدن در سرویس را اندازه بگیرید. ابعاد نصب را از مشخصات همان مدل بررسی کنید.',
  },
  {
    slug: 'wall-hung-toilets', label: 'توالت فرنگی وال هنگ', category: 'توالت فرنگی', subCategory: 'توالت فرنگی وال هنگ',
    description: 'مدل‌های توالت فرنگی وال هنگ را از نظر اندازه کاسه و سازگاری با سازه و فلاش‌تانک بررسی کنید.',
    guide: 'فاصله محل پیچ‌ها و مشخصات سازه پشت دیوار را پیش از سفارش بررسی کنید. اقلام همراه کاسه و تجهیزات نصب را جداگانه در صفحه مدل بخوانید.',
  },
  {
    slug: 'concealed-flush-tanks', label: 'فلاش تانک توکار', category: flushTankCategory, subCategory: concealedTanks,
    description: `مخزن‌ها و قطعات ثبت‌شده در گروه فلاش تانک توکار ${STORE_NAME} را همراه مشخصات نصب و قیمت مدل‌ها بررسی کنید.`,
    guide: 'در این گروه ممکن است مخزن، سازه و کلید جداگانه عرضه شوند. قبل از خرید مشخص کنید به مجموعه کامل نیاز دارید یا قطعه سازگار برای مخزن موجود.',
  },
  {
    slug: 'flush-plates', label: 'صفحه کلید فلاش تانک', category: flushTankCategory, subCategory: flushPlates,
    description: `صفحه کلیدهای فلاش‌تانک را بر اساس مدل، نوع کنترل، رنگ و سازگاری با مخزن در ${STORE_NAME} بررسی کنید.`,
    guide: 'سازگاری با مدل مخزن را پیش از انتخاب رنگ کنترل کنید. شباهت ظاهری یا ابعاد نزدیک، سازگاری صفحه کلید با مکانیزم مخزن را تضمین نمی‌کند.',
  },
  {
    slug: 'granite-sinks', label: 'سینک گرانیتی', category: 'سینک', subCategory: 'گرانیتی',
    description: `مدل‌های سینک گرانیتی ${STORE_NAME} را با توجه به رنگ، ابعاد لگن و اندازه برش صفحه مقایسه کنید.`,
    guide: 'ابعاد کلی سینک با برش صفحه یکی نیست. برای مقایسه عمق لگن و نگهداری سطح، اطلاعات مدل و توصیه نظافت را بخوانید.',
  },
  {
    slug: 'inset-steel-sinks', label: 'سینک استیل توکار', category: 'سینک', subCategory: 'استیل توکار',
    description: `سینک‌های استیل توکار ${STORE_NAME} را از نظر جهت لگن و سینی، اندازه و فضای زیر کابینت بررسی کنید.`,
    guide: 'قبل از برش، جهت سینی و محل نصب شیر را قطعی کنید. عرض داخلی کابینت را هم با ابعاد زیر سینک بسنجید.',
  },
  {
    slug: 'handmade-sinks', label: 'سینک دست‌ساز', category: 'سینک', subCategory: 'سینک های دست ساز',
    description: `مدل‌های سینک دست‌ساز ${STORE_NAME} را از نظر فرم لگن، فضای شست‌وشو و شرایط نصب مقایسه کنید.`,
    guide: 'دسترسی به گوشه لگن، جای قرار گرفتن ظروف بزرگ و نوع زیرآب را در تصاویر و مشخصات مدل بررسی کنید.',
  },
  {
    slug: 'double-bowl-sinks', label: 'سینک دو لگنه', category: 'سینک', nameMatch: /دو[\s‌]+لگنه/,
    description: 'سینک‌هایی را ببینید که دو لگنه بودن آن‌ها در نام محصول ثبت شده است. ابعاد هر لگن و محل نصب را مقایسه کنید.',
    guide: 'اگر هم‌زمان از هر دو لگن استفاده می‌کنید، اندازه مفید هر لگن و فضای لازم برای اتصال هر دو خروجی را اندازه بگیرید.',
  },
  {
    slug: 'concealed-hoods', label: 'هود مخفی و توکار', category: 'هود', nameMatch: /هود[\s‌]+(?:مخفی|توکار)/,
    description: `مدل‌های هود توکار و مخفی ${STORE_NAME} را با توجه به فضای کابینت، عرض نصب و مسیر خروج هوا مقایسه کنید.`,
    guide: 'عرض بدنه و فضای داخل کابینت را جدا اندازه بگیرید. مسیر کانال را با موقعیت خروجی همان مدل تطبیق دهید.',
  },
  {
    slug: 'glass-cooktops', label: 'اجاق گاز شیشه‌ای', category: 'اجاق گاز', subCategory: 'اجاق گاز شیشه‌ای',
    description: `مدل‌های اجاق گاز شیشه‌ای ${STORE_NAME} را بر اساس آرایش شعله‌ها، شرایط نصب و ابعاد اعلام‌شده مقایسه کنید.`,
    guide: 'محل شعله بزرگ را با اندازه ظروف و فضای اطراف اجاق تطبیق دهید. راهنمای نظافت صفحه هر مدل را پیش از خرید بخوانید.',
  },
  {
    slug: 'steel-cooktops', label: 'اجاق گاز استیل', category: 'اجاق گاز', subCategory: 'اجاق گاز استیل',
    description: `مدل‌های اجاق گاز استیل ${STORE_NAME} را از نظر فضای برش کابینت، چیدمان شبکه‌ها و مشخصات هر مدل بررسی کنید.`,
    guide: 'قبل از مقایسه قیمت، ابعاد برش و موقعیت اتصال گاز را کنترل کنید. چیدمان شبکه‌ها در استفاده هم‌زمان از چند ظرف اهمیت دارد.',
  },
]

const aliases: Record<string, readonly string[]> = {
  alvand: ['الوند', 'alvand'],
  morvarid: ['مروارید', 'morvarid'],
  'mix-plus': ['میکس پلاس', 'mix plus', 'mixplus'],
  'imen-ab': ['ایمن آب', 'imen ab', 'imenab'],
  sarodi: ['سارودی', 'sarodi'],
  simer: ['سیمر', 'simer'],

}

function brandKey(value: string) {
  return value.trim().toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[\s‌-]+/g, ' ')
}

export function getBrandSlug(value?: string) {
  const key = brandKey(value ?? '')
  if (!key || key === 'all') return undefined
  const known = Object.entries(aliases).find(([, names]) => names.some(name => brandKey(name) === key))
  return (known?.[0] ?? key.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')) || undefined
}

export function brandHref(slug: string) {
  return '/brand/' + encodeURIComponent(slug)
}

export function collectionHref(slug: string) {
  return '/subcategory/' + slug
}

export function matchesCatalogSubcategory(product: Pick<CatalogProduct, 'category' | 'subCategory' | 'name'>, subCategory: string) {
  if (product.subCategory === subCategory) return true
  if (product.category !== flushTankCategory) return false
  if (subCategory === concealedTanks && product.subCategory === flushPlates) return true
  return (subCategory === concealedTanks || subCategory === flushPlates) &&
    flushPlateName.test(product.name ?? '')
}

export function catalogSubcategoryFilter(subCategory?: string) {
  if (!subCategory || subCategory === 'all') return {}
  if (subCategory !== concealedTanks && subCategory !== flushPlates) return { subCategory }
  return {
    $or: [
      { subCategory },
      ...(subCategory === concealedTanks ? [{ category: flushTankCategory, subCategory: flushPlates }] : []),
      { category: flushTankCategory, name: flushPlateName },
    ],
  }
}

function matches(product: CatalogProduct, definition: Collection) {
  return product.category === definition.category &&
    (!definition.subCategory || matchesCatalogSubcategory(product, definition.subCategory)) &&
    (!definition.nameMatch || definition.nameMatch.test(product.name ?? ''))
}

export function getExactCollection(category: string, subCategory: string) {
  return collections.find(item => !item.nameMatch && item.category === category && item.subCategory === subCategory)
}

export function getProductCollection(product: CatalogProduct) {
  return getExactCollection(product.category, product.subCategory ?? '') ??
    collections.find(item => matches(product, item))
}

export const brandGuides: Readonly<Record<string, string>> = {
  alvand: 'برای مقایسه شیرهای الوند، ابتدا ارتفاع و دسترسی آبریز را نسبت به سینک اندازه بگیرید. در مدل‌های شاوری یا دومنظوره، مسیر شلنگ و اتصالات اعلام‌شده‌ را هم بررسی کنید.',
  morvarid: 'در میان مدل‌های مروارید، ابتدا نوع نصب و ابعاد سرویس را تعیین کنید. هنگام مقایسه مدل‌های درجه‌دار، درجه انتخابی و جزئیات همان مدل را در صفحه محصول تطبیق دهید.',
  'mix-plus': 'برای انتخاب از این کاتالوگ، نوع دستگاه یا سینک را جداگانه مشخص کنید. برای مدل‌های توکار، ابعاد بیرونی را با ابعاد برش یا فضای نصب اشتباه نگیرید.',
  'imen-ab': 'پیش از انتخاب مخزن، کلید یا قطعه ایمن آب، نام مدل تجهیز موجود و محل نصب آن را مشخص کنید. در صفحه هر محصول ببینید کدام قطعات همراه آن عرضه می‌شوند.',
  sarodi: 'در مدل‌های سارودی، نوع نصب مخزن و سازگاری قطعه با تجهیز فعلی را بررسی کنید. اگر محصول گزینه‌های رنگی دارد، پیش از سفارش تصویر و وضعیت همان گزینه را ببینید.',
  simer: 'برای انتخاب میان مدل‌های سیمر در این فهرست، ابعاد فضای نصب و اطلاعات ثبت‌شده هر مدل را مقایسه کنید. جزئیات ثبت‌شده در صفحه مدل، مبنای انتخاب است.',
}

export const combinations = [
  {
    brand: 'imen-ab', collection: 'flush-plates',
    description: `صفحه کلیدهای ثبت‌شده با برند ایمن آب را از نظر مدل، رنگ و سازگاری با مخزن توکار در ${STORE_NAME} مقایسه کنید.`,
    guide: 'اگر مخزن ایمن آب از قبل نصب شده است، نام مدل مخزن و شکل اتصال پشت کلید فعلی را بررسی کنید. سپس صفحه کلیدهای این فهرست را بر اساس اطلاعات همان مدل و رنگ قابل انتخاب مقایسه کنید.',
  },
] as const

export function buildCatalogLandings(products: CatalogProduct[]) {
  const brands = new Map<string, { label: string; products: CatalogProduct[] }>()
  for (const product of products) {
    const slug = getBrandSlug(product.brand)
    if (!slug || !product.brand) continue
    const existing = brands.get(slug)
    if (existing) {
      existing.products.push(product)
      if (!/[\u0600-\u06ff]/.test(existing.label) && /[\u0600-\u06ff]/.test(product.brand)) existing.label = product.brand.trim()
    } else brands.set(slug, { label: product.brand.trim(), products: [product] })
  }
  const subcategories = new Map<string, { definition: Collection; products: CatalogProduct[] }>()
  for (const definition of collections) {
    const matched = products.filter(product => matches(product, definition))
    if (matched.length) subcategories.set(definition.slug, { definition, products: matched })
  }
  const selected = combinations.flatMap(configuration => {
    const brand = brands.get(configuration.brand)
    const subcategory = subcategories.get(configuration.collection)
    if (!brand || !subcategory) return []
    const intersection = subcategory.products.filter(product => getBrandSlug(product.brand) === configuration.brand)
    // An editorial page must have inventory and a meaningfully distinct catalogue from both parents.
    if (intersection.length < 4 || brand.products.length - intersection.length < 2 ||
        subcategory.products.length - intersection.length < 2) return []
    return [{ configuration, brand, subcategory, products: intersection }]
  })
  return { brands, subcategories, selected }
}

export function categoryHref(category: string) {
  return getCategoryLandingPath(category) ?? '/search?' + new URLSearchParams({ category })
}
