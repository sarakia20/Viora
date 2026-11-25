'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { getProductImageSource, PRODUCT_IMAGE_PLACEHOLDER } from '@/lib/store-images'

export default function ProductImage({
  src, unoptimized, onLoad, onError, fallback = true, ...props
}: Omit<ImageProps, 'src'> & { src?: string; fallback?: boolean }) {
  const source = getProductImageSource(src)
  const [failedSource, setFailedSource] = useState<string>()
  const showPlaceholder = !source || failedSource === source
  if (showPlaceholder && !fallback) return null

  return (
    <Image
      {...props}
      src={showPlaceholder ? PRODUCT_IMAGE_PLACEHOLDER : source}
      unoptimized={unoptimized || showPlaceholder || !source?.startsWith('/')}
      onLoad={showPlaceholder ? undefined : onLoad}
      onError={showPlaceholder ? undefined : (event) => {
        setFailedSource(source)
        onError?.(event)
      }}
    />
  )
}
