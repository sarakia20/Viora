import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

type CardItem = {
  title: string
  link: { text: string; href: string }
  items: {
    name: string
    items?: string[]
    image: string
    href: string
  }[]
}

export function HomeCard({ cards }: { cards: CardItem[] }) {
  return (
    <div className='flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-4'>
      {cards.map((card) => (
        <Card key={card.title} className='flex min-w-[280px] snap-start flex-col overflow-hidden rounded-xl xs:min-w-[300px] md:min-w-0'>
          <CardContent className='p-4 flex-1'>
            <h3 className='mb-4 text-lg font-bold sm:text-xl'>{card.title}</h3>
            <div className='grid grid-cols-2 gap-3 sm:gap-4'>
              {card.items.map((item, index) => (
  <Link
    key={`${item.name}-${index}`}
                  href={item.href}
                  className='flex flex-col'
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    className='aspect-square object-scale-down max-w-full h-auto mx-auto'
                    height={120}
                    width={120}
                  />
                  <p className='text-center text-sm whitespace-nowrap overflow-hidden text-ellipsis'>
                    {item.name}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
          {card.link && (
            <CardFooter>
              <Link href={card.link.href} className='mt-4 block'>
                {card.link.text}
              </Link>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}
