'use client'

import { redirect, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import useSettingStore from '@/hooks/use-setting-store'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { IUserSignIn } from '@/types'
import { signInWithCredentials } from '@/lib/actions/user.actions'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSignInSchema } from '@/lib/validator'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

const signInDefaultValues = {
  phone: '',
  password: '',
}

export default function CredentialsSignInForm() {
  const {
    setting: { site },
  } = useSettingStore()

  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IUserSignIn) => {
    try {
      await signInWithCredentials({
        phone: data.phone,
        password: data.password,
      })
      redirect(callbackUrl)
    } catch (error) {
      if (isRedirectError(error)) {
        throw error
      }

      toast({
        title: 'خطا',
        description: 'شماره موبایل یا رمز عبور نامعتبر است',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type='hidden' name='callbackUrl' value={callbackUrl} />

        <div className='space-y-6'>
          <FormField
  control={control}
  name='phone'
  render={({ field }) => (
    <FormItem className='w-full'>
      <FormLabel>شماره موبایل  </FormLabel>
      <FormControl>
        <Input
          placeholder='09xxxxxxxxx'
          type='text'
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

          <FormField
            control={control}
            name='password'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>رمز عبور</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='رمز عبور را وارد کنید'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
  type='submit'
  className='w-full bg-slate-800 text-white hover:bg-slate-700'
>
  ورود
</Button>

          <div className='text-xs text-center text-slate-500 leading-6'>
  ورود شما به معنای پذیرش
  <Link href='/page/conditions-of-use' className='mx-1 text-primary'>
    قوانین
  </Link>
  و
  <Link href='/page/privacy-policy' className='mx-1 text-primary'>
    حریم خصوصی
  </Link>
  است.
</div>
        </div>
      </form>
    </Form>
  )
}