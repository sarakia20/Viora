'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { updateUser } from '@/lib/actions/user.actions'
import { USER_ROLES } from '@/lib/constants'
import { IUser } from '@/lib/db/models/user.model'
import { UserUpdateSchema } from '@/lib/validator'

const getRoleLabel = (role: string) => {
  if (role === 'Admin') return 'مدیر'
  if (role === 'User') return 'کاربر'
  return role
}

const UserEditForm = ({ user }: { user: IUser }) => {
  const router = useRouter()

  const form = useForm<z.infer<typeof UserUpdateSchema>>({
    resolver: zodResolver(UserUpdateSchema),
    defaultValues: user,
  })

  const { toast } = useToast()

  async function onSubmit(values: z.infer<typeof UserUpdateSchema>) {
    try {
      const res = await updateUser({
        ...values,
        _id: user._id,
      })

      if (!res.success) {
        return toast({
          variant: 'destructive',
          description: res.message,
        })
      }

      toast({
        description: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد',
      })

      form.reset()
      router.push(`/admin/users`)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message || 'خطایی رخ داد',
      })
    }
  }

  return (
    <Form {...form}>
      <form
        method='post'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8'
      >
        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>نام</FormLabel>
                <FormControl>
                  <Input placeholder='نام کاربر را وارد کنید' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>ایمیل</FormLabel>
                <FormControl>
                  <Input placeholder='ایمیل کاربر را وارد کنید' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name='role'
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <FormLabel>نقش کاربر</FormLabel>

                <Select
                  onValueChange={field.onChange}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='نقش کاربر را انتخاب کنید' />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex items-center justify-between gap-3'>
          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? 'در حال ثبت...'
              : 'به‌روزرسانی کاربر'}
          </Button>

          <Button
            variant='outline'
            type='button'
            onClick={() => router.push(`/admin/users`)}
          >
            بازگشت
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default UserEditForm
