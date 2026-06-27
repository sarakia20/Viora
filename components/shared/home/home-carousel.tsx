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

  const getTextPosition = (title: string) => {
    if (title.includes('تجهیزات آشپزخانه')) {
  return 'left-8 md:left-20 top-[50%]'
}

    if (title.includes('چینی')) {
      return 'left-24 md:left-44 top-[48%]'
    }

    if (title.includes('شیرآلات')) {
      return 'left-28 md:left-52 top-[52%]'
    }

    if (title.includes('کاشی')) {
      return 'left-24 md:left-48 top-[50%]'
    }

    return 'left-24 md:left-48 top-[52%]'
  }

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
      className='w-full mx-auto'
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {items.map((item) => (
          <CarouselItem key={item.title}>
            <Link href={item.url}>
              <div className='relative flex aspect-[16/6] items-center justify-center overflow-hidden'>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  priority
                  className='object-cover'
                />

                <div
                  className={`absolute ${getTextPosition(
                    item.title
                  )} -translate-y-1/2 flex flex-col items-center text-center`}
                >
                  <h2 className='whitespace-nowrap text-3xl md:text-5xl font-bold leading-tight tracking-tight text-slate-900'>
                    {item.title}
                  </h2>

                  <p className='mt-3 text-base md:text-xl text-slate-600'>
                    {getSubtitle(item.title)}
                  </p>

                  <Button className='mt-7 h-12 rounded-xl bg-slate-900 px-8 text-sm font-bold text-white hover:bg-slate-800'>
                    {t(`${item.buttonCaption}`)}
                  </Button>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className='left-4 md:left-8' />
      <CarouselNext className='right-4 md:right-8' />
    </Carousel>
  )
}