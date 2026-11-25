'use client'
import ProductImage from './product-image'
import { useRef, useState } from 'react'

const ImageHover = ({
  src,
  hoverSrc,
  alt,
  sizes,
}: {
  src: string
  hoverSrc: string
  alt: string
  sizes: string
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [shouldLoadHover, setShouldLoadHover] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPointerOver = useRef(false)
  const isHoverDelayElapsed = useRef(false)
  const isHoverImageLoaded = useRef(false)

  const handleMouseEnter = () => {
    isPointerOver.current = true
    setShouldLoadHover(true)
    hoverTimeout.current = setTimeout(() => {
      isHoverDelayElapsed.current = true
      if (isHoverImageLoaded.current) setIsHovered(true)
    }, 1000)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    isPointerOver.current = false
    isHoverDelayElapsed.current = false
    setIsHovered(false)
  }

  const handleHoverImageLoad = () => {
    isHoverImageLoaded.current = true
    if (isPointerOver.current && isHoverDelayElapsed.current) {
      setIsHovered(true)
    }
  }

  return (
    <div
      className='relative h-52'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ProductImage
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-contain transition-opacity duration-500 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {shouldLoadHover && (
        <ProductImage
          src={hoverSrc}
          fallback={false}
          alt={alt}
          fill
          sizes={sizes}
          onLoad={handleHoverImageLoad}
          onError={() => {
            isHoverImageLoaded.current = false
            setIsHovered(false)
          }}
          className={`absolute inset-0 object-contain transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}

export default ImageHover
