import { signInCallback } from '@/lib/sign-in-callback'
import { publicMetadata } from '@/lib/public-seo'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SeparatorWithOr from '@/components/shared/separator-or'

import { auth } from '@/auth'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import CredentialsSignInForm from './credentials-signin-form'

import { Button } from '@/components/ui/button'
import { getSetting } from '@/lib/actions/setting.actions'

export const metadata = publicMetadata({
  title: 'ورود به حساب کاربری ویورا',
  description: 'برای مشاهده حساب کاربری و پیگیری سفارش‌های خود وارد فروشگاه ویورا شوید.',
  path: '/sign-in',
  index: false,
})

export default async function SignInPage(props: {
  searchParams: Promise<{
    callbackUrl: string
  }>
}) {
  const searchParams = await props.searchParams
  const { site } = await getSetting()

  const callbackUrl = signInCallback(searchParams.callbackUrl)

  const session = await auth()
  if (session) {
    return redirect(callbackUrl)
  }

  return (
    <div className='w-full'>
      <Card>
        <CardHeader className='p-4 sm:p-6'>
          <CardTitle className='text-xl sm:text-2xl'><h1>ورود به حساب کاربری</h1></CardTitle>
        </CardHeader>
        <CardContent className='p-4 pt-0 sm:p-6 sm:pt-0'>
          <div>
            <CredentialsSignInForm />
           
          </div>
        </CardContent>
      </Card>
      <SeparatorWithOr>کاربر جدید هستید؟</SeparatorWithOr>

     <div className='mt-6 pb-10'>
  <Link href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
    <Button className='w-full' variant='outline'>
      ایجاد حساب کاربری
    </Button>
  </Link>
</div>
    </div>
  )
}
