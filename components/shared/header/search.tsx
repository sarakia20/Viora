import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function Search() {
  return (
    <form
      action='/search'
      method='GET'
      className='flex h-11 w-full items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition-all focus-within:bg-white focus-within:shadow-md md:h-12'
    >
      <Input
        name='q'
        type='search'
        placeholder='جستجوی محصولات...'
        className='min-w-0 h-full flex-1 border-0 bg-transparent px-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
      />

      <button
        type='submit'
        aria-label='search'
        className='flex h-full w-12 shrink-0 items-center justify-center bg-slate-700 transition hover:bg-slate-800 md:w-14'
      >
        <SearchIcon className='h-5 w-5 text-white' />
      </button>
    </form>
  )
}