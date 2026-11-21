'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { SignOut } from '@/lib/actions/user.actions'
import { LogOut } from 'lucide-react'

export default function UserMenuSignOut({ children }: { children: string }) {
  return (
    <form action={SignOut}>
      <DropdownMenuItem
        asChild
        // Keep the form mounted while the button submits the existing action.
        onSelect={(event) => event.preventDefault()}
        className='min-h-11 w-full cursor-pointer gap-3 rounded-lg px-3 font-medium text-red-600 duration-150 hover:bg-red-50 focus:bg-red-50 focus:text-red-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-300'
      >
        <button type='submit'>
          <LogOut aria-hidden='true' strokeWidth={1.6} />
          {children}
        </button>
      </DropdownMenuItem>
    </form>
  )
}
