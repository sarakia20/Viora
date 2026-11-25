import { CatalogLanding, catalogMetadata, getCatalogPage } from '@/components/shared/catalog-landing'
import type { QueryParams } from '@/lib/public-seo'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<QueryParams>
}

async function load({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  return getCatalogPage('subcategory', slug, undefined, JSON.stringify(query))
}

export async function generateMetadata(props: Props) {
  return catalogMetadata(await load(props))
}

export default async function Page(props: Props) {
  return <CatalogLanding result={await load(props)} />
}
