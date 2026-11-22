'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export default function ProductDescription({ children }: { children: ReactNode }) {
  const id = useId()
  const contentRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const measure = () => {
      if (!content.getClientRects().length) return

      const previewHeight = 2 * parseFloat(getComputedStyle(content).lineHeight)
      const needsToggle = content.getBoundingClientRect().height > previewHeight
      setOverflows(needsToggle)
      if (!needsToggle) setExpanded(false)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div
        id={id}
        className={`text-sm leading-8 sm:text-base sm:leading-9 ${expanded ? '' : 'max-h-[2lh] overflow-hidden print:max-h-none'}`}
      >
        <div ref={contentRef} className='flow-root whitespace-pre-wrap break-words text-slate-600'>
          {children}
        </div>
      </div>
      {overflows && (
        <button
          type='button'
          aria-controls={id}
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}
          className='mt-1 min-h-11 rounded-sm text-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 print:hidden'
        >
          {expanded ? 'مشاهده کمتر' : 'مشاهده بیشتر'}
        </button>
      )}
    </>
  )
}
