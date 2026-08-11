'use client'

import { SlidersHorizontal } from 'lucide-react'

import ProductSortSelector from '@/components/shared/product/product-sort-selector'
import SearchSidebar from '@/components/shared/search-sidebar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type SearchParams = {
  q?: string
  category?: string
  subCategory?: string
  brand?: string
  tag?: string
  price?: string
  rating?: string
  sort?: string
  page?: string
}

export default function MobileSearchControls({
  categories,
  tags,
  params,
  rating,
  price,
  tag,
  sortOrders,
  sort,
}: {
  categories: string[]
  tags: string[]
  params: SearchParams
  rating: string
  price: string
  tag: string
  sortOrders: { value: string; name: string }[]
  sort: string
}) {
  return (
    <div className='mt-4 grid grid-cols-2 gap-2 md:hidden'>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline' className='w-full gap-2'>
            <SlidersHorizontal className='h-4 w-4' />
            فیلترها
          </Button>
        </SheetTrigger>
        <SheetContent
          side='right'
          dir='rtl'
          className='w-[90%] overflow-y-auto px-4 sm:max-w-sm'
        >
          <SheetHeader className='mb-5 text-right'>
            <SheetTitle>فیلترها</SheetTitle>
          </SheetHeader>
          <SearchSidebar
            categories={categories}
            tags={tags}
            params={params}
            rating={rating}
            price={price}
            tag={tag}
          />
        </SheetContent>
      </Sheet>

      <ProductSortSelector
        sortOrders={sortOrders}
        sort={sort}
        params={params}
      />
    </div>
  )
}
