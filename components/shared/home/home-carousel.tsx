'use client'

import * as React from 'react'
import Image from 'next/image'
import Autoplay from 'embla-carousel-autoplay'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { ICarousel } from '@/types'

export function HomeCarousel({ items }: { items: ICarousel[] }) {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  )

  const t = useTranslations('Home')

  const getSubtitle = (title: string) => {
    if (title.includes('تجهیزات آشپزخانه')) {
      return 'زیبایی و کارایی در قلب خانه'
    }

    if (title.includes('شیرآلات')) {
      return 'ترکیبی از زیبایی و دوام'
    }

    if (title.includes('چینی')) {
      return 'طراحی مینیمال، کیفیت ماندگار'
    }

    if (title.includes('کاشی')) {
      return 'زیبایی جاودانه برای هر فضا'
    }

    return ''
  }

  return (
    <Carousel
      dir='ltr'
      plugins={[plugin.current]}
      className='w-full overflow-hidden'
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent className='ml-0'>
        {items.map((item) => (
          <CarouselItem key={item.title} className='pl-0'>
            <Link href={item.url} className='block'>
              <div className='relative h-[320px] w-full overflow-hidden sm:h-[380px] md:h-[430px] lg:h-[480px]'>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  priority
                  sizes='100vw'
                  className='object-cover object-center'
                />

                <div className='absolute inset-0 bg-black/10' />

                <div className='absolute inset-0 flex items-center justify-center px-12 text-center md:justify-start md:px-24'>
                  <div className='flex max-w-[320px] flex-col items-center md:max-w-[520px]'>
                    <h2 className='text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl'>
                      {item.title}
                    </h2>

                    <p className='mt-3 text-base leading-7 text-slate-700 md:text-xl'>
                      {getSubtitle(item.title)}
                    </p>

                    <Button className='mt-6 h-11 rounded-xl bg-slate-900 px-7 text-sm font-bold text-white hover:bg-slate-800 md:h-12 md:px-8'>
                      {t(item.buttonCaption)}
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className='left-3 h-10 w-10 md:left-8' />
      <CarouselNext className='right-3 h-10 w-10 md:right-8' />
    </Carousel>
  )
}