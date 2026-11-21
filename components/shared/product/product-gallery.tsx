'use client'

import { useState } from 'react'
import Image from 'next/image'
import { isDirectGalleryImage, resolveProductImage } from '@/lib/store-images'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
export default function ProductGallery({
  images,
  productName,
}: {
  images: string[]
  productName: string
}) {
  const [selectedImage, setSelectedImage] = useState(0)
  if (!images.length) return <div className='flex h-80 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500'>تصویری ثبت نشده است.</div>
  const activeImage = resolveProductImage(images[selectedImage] ?? images[0])
  return (
    <div className='flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-3 sm:p-5'>
      {images.length > 1 && <div className='order-2 flex justify-center gap-3 overflow-x-auto p-1'>
        {images.map((image, index) => (
          <button
            key={index}
            type='button'
            aria-label={`نمایش تصویر ${index + 1}`}
            aria-pressed={selectedImage === index}
            onClick={() => {
              setSelectedImage(index)
            }}
            onMouseOver={() => {
              setSelectedImage(index)
            }}
            className={`shrink-0 bg-white rounded-lg overflow-hidden ${
              selectedImage === index
                ? 'ring-2 ring-slate-700'
                : 'ring-1 ring-gray-300'
            }`}
          >
            <Image
              src={resolveProductImage(image)}
              alt={`${productName} - تصویر ${index + 1}`}
              width={48}
              height={48}
            />
          </button>
        ))}
      </div>}

      <div className='w-full'>
        <Zoom>
          <div className='relative h-[300px] xs:h-[360px] sm:h-[440px] lg:h-[500px]'>
            <Image
              src={activeImage}
              unoptimized={isDirectGalleryImage(activeImage)}
              alt={productName}
              fill
              sizes='(min-width: 1024px) 38vw, 90vw'
              className='object-contain'
              priority
            />
          </div>
        </Zoom>
      </div>
      <p className='order-3 text-center text-xs text-slate-500'>برای بزرگ‌نمایی، تصویر را لمس کنید.</p>
    </div>
  )
}
