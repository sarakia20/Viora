import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import SignUpForm from './signup-form'

export const metadata: Metadata = {
  title: 'ثبت نام',
}

export default async function SignUpPage(props: {
  searchParams: Promise<{
    callbackUrl: string
  }>
}) {
  const searchParams = await props.searchParams

  const { callbackUrl } = searchParams

  const session = await auth()
  if (session) {
    return redirect(callbackUrl || '/')
  }

  return (
    <div className='w-full'>
      <Card>
        <CardHeader className='p-4 sm:p-6'>
          <CardTitle className='text-xl sm:text-2xl'>ایجاد حساب کاربری</CardTitle>
        </CardHeader>
        <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  )
}
