import { signInCallback } from '@/lib/sign-in-callback'
import { publicMetadata } from '@/lib/public-seo'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import SignUpForm from './signup-form'

export const metadata = publicMetadata({
  title: 'ایجاد حساب کاربری ویورا',
  description: 'برای ثبت و پیگیری سفارش‌های خود در فروشگاه ویورا حساب کاربری بسازید.',
  path: '/sign-up',
  index: false,
})

export default async function SignUpPage(props: {
  searchParams: Promise<{
    callbackUrl: string
  }>
}) {
  const searchParams = await props.searchParams

  const callbackUrl = signInCallback(searchParams.callbackUrl)

  const session = await auth()
  if (session) {
    return redirect(callbackUrl)
  }

  return (
    <div className='w-full'>
      <Card>
        <CardHeader className='p-4 sm:p-6'>
          <CardTitle className='text-xl sm:text-2xl'><h1>ایجاد حساب کاربری</h1></CardTitle>
        </CardHeader>
        <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  )
}
