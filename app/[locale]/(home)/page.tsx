import { HomeCard } from '@/components/shared/home/home-card'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import ProductSlider from '@/components/shared/product/product-slider'
import { Card, CardContent } from '@/components/ui/card'

import { getProductsByTag } from '@/lib/actions/product.actions'
import { getSetting } from '@/lib/actions/setting.actions'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getAbsoluteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
  title: { absolute: 'فروشگاه ویورا | خرید شیرآلات، سینک، هود و تجهیزات ساختمانی' },
  description:
    'خرید انواع شیرآلات، سینک ظرفشویی، هود، گاز، فلاش تانک و تجهیزات سرویس بهداشتی از فروشگاه ویورا. مشاهده مدل‌ها، مشخصات، قیمت و موجودی محصولات.',
  alternates: {
    canonical: getAbsoluteUrl('/'),
  },
}

export default async function HomePage() {
  const t = await getTranslations('Home')
  const { carousels } = await getSetting()
  const [todaysDeals, bestSellingProducts] = await Promise.all([
    getProductsByTag({ tag: 'todays-deal' }),
    getProductsByTag({ tag: 'best-seller' }),
  ])

  return (
    <>
      <HomeCarousel items={carousels} />
      <h1 className='sr-only'>
          فروشگاه ویورا؛ خرید تجهیزات آشپزخانه، ساختمانی و سرویس بهداشتی
      </h1>
      <div className='space-y-3 bg-border px-3 pb-3 sm:px-4 sm:pb-4 md:space-y-4'>
        <div className={`px-1 sm:px-0 md:px-4 lg:px-6 ${carousels.length ? 'pt-8 sm:pt-9 lg:pt-10' : 'pt-3 sm:pt-4'}`}>
          <HomeCard />
        </div>
        <Card className='w-full overflow-hidden rounded-xl'>
          <CardContent className='items-center gap-3 p-3 sm:p-4'>
            <ProductSlider title={t("Today's Deals")} products={todaysDeals} />
          </CardContent>
        </Card>
        <Card className='w-full overflow-hidden rounded-xl'>
          <CardContent className='items-center gap-3 p-3 sm:p-4'>
            <ProductSlider
              title={t('Best Selling Products')}
              products={bestSellingProducts}
              hideDetails
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
