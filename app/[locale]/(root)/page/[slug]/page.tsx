import ReactMarkdown from 'react-markdown'
import { notFound } from 'next/navigation'
import { getWebPageBySlug } from '@/lib/actions/web-page.actions'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params

  const { slug } = params

  const webPage = await getWebPageBySlug(slug)
  if (!webPage) {
    return { title: 'Web page not found' }
  }
  return {
    title: webPage.title,
  }
}

export default async function ProductDetailsPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page: string; color: string; size: string }>
}) {
  const params = await props.params
  const { slug } = params
  const webPage = await getWebPageBySlug(slug)

  if (!webPage) notFound()

  return (
    <div className='mx-auto w-full max-w-3xl py-2 sm:p-4'>
      <h1 className='h1-bold py-4'>{webPage.title}</h1>
      <section className='text-justify text-lg mb-20 web-page-content'>
        <ReactMarkdown>{webPage.content}</ReactMarkdown>
      </section>
    </div>
  )
}
