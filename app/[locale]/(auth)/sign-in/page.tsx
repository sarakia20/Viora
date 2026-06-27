import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import SeparatorWithOr from '@/components/shared/separator-or'

import { auth } from '@/auth'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import CredentialsSignInForm from './credentials-signin-form'

import { Button } from '@/components/ui/button'
import { getSetting } from '@/lib/actions/setting.actions'

export const metadata: Metadata = {
  title: 'ورود',
}

export default async function SignInPage(props: {
  searchParams: Promise<{
    callbackUrl: string
  }>
}) {
  const searchParams = await props.searchParams
  const { site } = await getSetting()

  const { callbackUrl = '/' } = searchParams

  const session = await auth()
  if (session) {
    return redirect(callbackUrl)
  }

  return (
    <div className='w-full'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>ورود به حساب کاربری</CardTitle>
        </CardHeader>
        <CardContent>
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
