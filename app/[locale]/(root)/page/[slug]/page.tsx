import ReactMarkdown from 'react-markdown'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getWebPageBySlug } from '@/lib/actions/web-page.actions'
import { publicMetadata } from '@/lib/public-seo'

const getPublicPage = cache(async (slug: string) => {
  const page = await getWebPageBySlug(slug)
  if (!page) notFound()
  return page
})

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const page = await getPublicPage(slug)
  const text = page.content.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim()
  return publicMetadata({
    title: `${page.title} | ویورا`,
    description: text.length > 155 ? `${text.slice(0, 155).replace(/\s+\S*$/, '')}…` : text || page.title,
    path: `/page/${encodeURIComponent(page.slug)}`,
  })
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params
  const page = await getPublicPage(slug)
  return (
    <div className='mx-auto w-full max-w-3xl py-2 sm:p-4'>
      <h1 className='h1-bold py-4'>{page.title}</h1>
      <section className='text-justify text-lg mb-20 web-page-content'>
        <ReactMarkdown components={{ h1: 'h2' }}>{page.content}</ReactMarkdown>
      </section>
    </div>
  )
}
