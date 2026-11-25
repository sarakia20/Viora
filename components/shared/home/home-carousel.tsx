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
  const [plugin] = React.useState(() =>
    Autoplay({
      delay: 10000,
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
      plugins={[plugin]}
      className='w-full overflow-hidden'
      onMouseEnter={plugin.stop}
      onMouseLeave={plugin.reset}
    >
      <CarouselContent className='ml-0'>
        {items.map((item, index) => (
          <CarouselItem key={item.title} className='flex pl-0'>
            <Link href={item.url} className='grid w-full'>
              <div className='relative grid min-h-[max(11rem,50vw)] w-full items-center overflow-hidden bg-[#f4f2ef] sm:min-h-[37.5vw]'>
                <Image
                  src={
                    item.image === '/images/banner-faucet.jpg'
                      ? '/images/banner-faucet.webp'
                      : item.image === '/images/banner-kitchen.jpg'
                        ? '/images/banner-kitchen.webp'
                        : item.image
                  }
                  alt={item.title}
                  fill
                  unoptimized={item.image === '/images/banner-faucet.jpg' || item.image === '/images/banner-faucet.webp'}
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  sizes='100vw'
                  className='object-contain object-center lg:object-cover'
                />

                <div className='absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/55 to-transparent' />

                <div className='relative flex w-1/2 min-w-0 justify-center py-6 pl-10 pr-2 text-center sm:w-[46%] sm:pl-14 sm:pr-8 md:pl-20 md:pr-10 lg:px-20'>
                  <div className='w-full max-w-xl'>
                    <h2 className='break-words text-base font-bold leading-tight text-slate-900 xs:text-lg sm:text-2xl md:text-4xl lg:text-5xl'>
                      {item.title}
                    </h2>

                    <p className='mt-1 hidden text-xs leading-5 text-slate-700 xs:block sm:mt-2 sm:text-sm md:mt-4 md:text-lg lg:text-xl'>
                      {getSubtitle(item.title)}
                    </p>

                    <Button asChild className='mt-2 h-auto min-h-8 max-w-full whitespace-normal rounded-lg bg-slate-900 px-3 py-1 text-[10px] font-bold text-white hover:bg-slate-800 xs:text-xs sm:mt-3 sm:min-h-9 sm:px-4 md:mt-6 md:min-h-11 md:px-6 md:text-sm'>
                      <span>{t(item.buttonCaption)}</span>
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
