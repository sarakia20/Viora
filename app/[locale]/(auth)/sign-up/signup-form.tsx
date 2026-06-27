'use client'

import { useState } from 'react'
import { redirect, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { IUserSignUp } from '@/types'
import { registerUser, signInWithCredentials } from '@/lib/actions/user.actions'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSignUpSchema } from '@/lib/validator'
import { Separator } from '@/components/ui/separator'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { Eye, EyeOff } from 'lucide-react'

const signUpDefaultValues = {
  name: '',
  phone: '',
  
  password: '',
  confirmPassword: '',
}

export default function CredentialsSignUpForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<IUserSignUp>({
    resolver: zodResolver(UserSignUpSchema),
    defaultValues: signUpDefaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IUserSignUp) => {
    try {
      const res = await registerUser(data)

      if (!res.success) {
        toast({
          title: 'خطا',
          description: res.error,
          variant: 'destructive',
        })
        return
      }

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

        <div className='space-y-5'>
          <FormField
            control={control}
            name='name'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>نام و نام خانوادگی</FormLabel>
                <FormControl>
                  <Input
                    placeholder='نام و نام خانوادگی'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='phone'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>شماره موبایل</FormLabel>
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
                  <div className='relative'>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder='رمز عبور'
                      className='pl-10'
                      {...field}
                    />

                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-500'
                    >
                      {showPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>تکرار رمز عبور</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder='تکرار رمز عبور'
                      className='pl-10'
                      {...field}
                    />

                    <button
                      type='button'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-500'
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type='submit'
            className='w-full bg-slate-800 text-white hover:bg-slate-700'
          >
            ثبت نام
          </Button>

          <div className='text-xs text-center text-slate-500 leading-6'>
            ثبت‌نام شما به معنای پذیرش
            <Link href='/page/conditions-of-use' className='mx-1 text-primary'>
              قوانین
            </Link>
            و
            <Link href='/page/privacy-policy' className='mx-1 text-primary'>
              حریم خصوصی
            </Link>
            است.
          </div>

          <Separator />

          <div className='text-sm text-center'>
            قبلاً حساب کاربری ساخته‌اید؟{' '}
            <Link className='link' href={`/sign-in?callbackUrl=${callbackUrl}`}>
              ورود
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}