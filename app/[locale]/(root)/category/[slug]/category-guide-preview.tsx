'use client'

import { ChevronDown } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'

export default function CategoryGuidePreview({ children }: { children: ReactNode }) {
  const id = useId()
  const contentRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [heights, setHeights] = useState<{ full: number; preview: number }>()

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const measure = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(content).lineHeight)
      const limit = lineHeight * 4
      const top = content.getBoundingClientRect().top
      let preview = 0
      for (const paragraph of content.children) {
        const bounds = paragraph.getBoundingClientRect()
        const offset = bounds.top - top
        const lines = Math.floor((Math.min(bounds.bottom - top, limit) - offset) / lineHeight)
        if (lines > 0) preview = offset + lines * lineHeight
        if (bounds.bottom - top >= limit) break
      }
      setHeights({ full: content.offsetHeight, preview: preview || limit })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  const canExpand = heights && heights.full > heights.preview

  return (
    <div>
      <div
        id={id}
        className='overflow-hidden transition-[max-height] duration-300 ease-in-out motion-reduce:transition-none'
        style={heights ? { maxHeight: expanded ? heights.full : heights.preview } : undefined}
      >
        <div ref={contentRef} className='space-y-3 text-sm/7 text-slate-700 sm:text-base/7'>
          {children}
        </div>
      </div>
      {canExpand && (
        <button
          type='button'
          aria-controls={id}
          aria-expanded={expanded}
          onClick={() => setExpanded((previous) => !previous)}
          className='mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700'
        >
          {expanded ? 'مشاهده کمتر' : 'مشاهده بیشتر'}
          <ChevronDown
            aria-hidden='true'
            className={`size-4 transition-transform duration-300 motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  )
}
