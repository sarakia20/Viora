import { notFound } from 'next/navigation'
import { CatalogLanding, catalogMetadata, getCatalogPage } from '@/components/shared/catalog-landing'
import type { QueryParams } from '@/lib/public-seo'

type Props = {
  params: Promise<{ slug: string; collection?: string[] }>
  searchParams: Promise<QueryParams>
}

async function load({ params, searchParams }: Props) {
  const [{ slug, collection }, query] = await Promise.all([params, searchParams])
  if (collection && collection.length !== 1) notFound()
  return getCatalogPage('brand', slug, collection?.[0], JSON.stringify(query))
}

export async function generateMetadata(props: Props) {
  return catalogMetadata(await load(props))
}

export default async function Page(props: Props) {
  return <CatalogLanding result={await load(props)} />
}
