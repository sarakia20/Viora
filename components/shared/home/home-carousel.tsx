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
    Autoplay({
      delay: 4500,
      stopOnInteraction: true,
    })
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
              <div className='relative aspect-[2/1] w-full overflow-hidden bg-[#f4f2ef] sm:aspect-[8/3]'>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  priority
                  sizes='100vw'
                  className='object-contain object-center'
                />

                <div className='absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/55 to-transparent' />

                <div className='absolute inset-y-0 left-0 flex w-[46%] items-center justify-center px-7 text-center sm:px-10 md:px-14 lg:px-20'>
                  <div className='w-full max-w-xl'>
                    <h2 className='text-base font-bold leading-tight text-slate-900 xs:text-lg sm:text-2xl md:text-4xl lg:text-5xl'>
                      {item.title}
                    </h2>

                    <p className='mt-1 hidden text-xs leading-5 text-slate-700 xs:block sm:mt-2 sm:text-sm md:mt-4 md:text-lg lg:text-xl'>
                      {getSubtitle(item.title)}
                    </p>

                    <Button className='mt-2 h-8 rounded-lg bg-slate-900 px-3 text-[10px] font-bold text-white hover:bg-slate-800 xs:text-xs sm:mt-3 sm:h-9 sm:px-4 md:mt-6 md:h-11 md:px-6 md:text-sm'>
                      {t(item.buttonCaption)}
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className='left-2 h-8 w-8 border-white/70 bg-white/85 sm:left-4 md:left-8 md:h-10 md:w-10' />
      <CarouselNext className='right-2 h-8 w-8 border-white/70 bg-white/85 sm:right-4 md:right-8 md:h-10 md:w-10' />
    </Carousel>
  )
}
