import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getTranslations } from 'next-intl/server'

export default async function Search() {
  const t = await getTranslations()

  return (
    <form
      action='/search'
      method='GET'
      className='flex h-12 w-full items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition-all hover:shadow-md focus-within:bg-white focus-within:shadow-md'
    >
      <Input
        className='h-full flex-1 border-0 bg-transparent px-5 text-sm text-slate-800 placeholder:text-slate-400 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
        placeholder='جستجوی شیرآلات، سینک، روشویی، کاشی و سرامیک...'
        name='q'
        type='search'
      />

      <button
        type='submit'
        aria-label='search'
        className='flex h-full w-14 shrink-0 items-center justify-center bg-slate-600 transition hover:bg-slate-700'
      >
        <SearchIcon className='h-5 w-5 text-white' />
      </button>
    </form>
  )
}