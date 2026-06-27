'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import MdEditor from 'react-markdown-editor-lite'
import ReactMarkdown from 'react-markdown'
import 'react-markdown-editor-lite/lib/index.css'

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
import { useToast } from '@/hooks/use-toast'
import { createWebPage, updateWebPage } from '@/lib/actions/web-page.actions'
import { IWebPage } from '@/lib/db/models/web-page.model'
import { WebPageInputSchema, WebPageUpdateSchema } from '@/lib/validator'
import { Checkbox } from '@/components/ui/checkbox'
import { toSlug } from '@/lib/utils'

const webPageDefaultValues =
  process.env.NODE_ENV === 'development'
    ? {
        title: 'Sample Page',
        slug: 'sample-page',
        content: 'Sample Content',
        isPublished: false,
      }
    : {
        title: '',
        slug: '',
        content: '',
        isPublished: false,
      }

const WebPageForm = ({
  type,
  webPage,
  webPageId,
}: {
  type: 'Create' | 'Update'
  webPage?: IWebPage
  webPageId?: string
}) => {
  const router = useRouter()

  const form = useForm<z.infer<typeof WebPageInputSchema>>({
    resolver:
      type === 'Update'
        ? zodResolver(WebPageUpdateSchema)
        : zodResolver(WebPageInputSchema),
    defaultValues:
      webPage && type === 'Update' ? webPage : webPageDefaultValues,
  })

  const { toast } = useToast()

  async function onSubmit(values: z.infer<typeof WebPageInputSchema>) {
    if (type === 'Create') {
      const res = await createWebPage(values)

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        toast({
          description: res.message,
        })
        router.push(`/admin/web-pages`)
      }
    }

    if (type === 'Update') {
      if (!webPageId) {
        router.push(`/admin/web-pages`)
        return
      }

      const res = await updateWebPage({ ...values, _id: webPageId })

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      } else {
        router.push(`/admin/web-pages`)
      }
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
            name='title'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>عنوان صفحه</FormLabel>
                <FormControl>
                  <Input placeholder='عنوان صفحه را وارد کنید' {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='slug'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>آدرس صفحه</FormLabel>

                <FormControl>
                  <div className='relative'>
                    <Input
                      placeholder='آدرس صفحه را وارد کنید'
                      className='pl-8'
                      {...field}
                    />

                    <button
                      type='button'
                      onClick={() => {
                        form.setValue('slug', toSlug(form.getValues('title')))
                      }}
                      className='absolute right-2 top-2.5 text-sm text-slate-600'
                    >
                      تولید خودکار
                    </button>
                  </div>
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex flex-col gap-5 md:flex-row'>
          <FormField
            control={form.control}
            name='content'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel>محتوای صفحه</FormLabel>

                <FormControl>
                  <MdEditor
                    {...field}
                    style={{ height: '500px' }}
                    renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
                    onChange={({ text }) => form.setValue('content', text)}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name='isPublished'
            render={({ field }) => (
              <FormItem className='space-x-2 items-center'>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>

                <FormLabel>نمایش در سایت</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div>
          <Button
            type='submit'
            size='lg'
            disabled={form.formState.isSubmitting}
            className='button col-span-2 w-full'
          >
            {form.formState.isSubmitting
              ? 'در حال ذخیره...'
              : type === 'Create'
                ? 'ایجاد صفحه'
                : 'بروزرسانی صفحه'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default WebPageForm
