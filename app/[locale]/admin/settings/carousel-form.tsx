import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { UploadButton } from '@/lib/uploadthing'
import { ISettingInput } from '@/types'
import { TrashIcon } from 'lucide-react'
import Image from 'next/image'
import { useFieldArray, UseFormReturn } from 'react-hook-form'

export default function CarouselForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'carousels',
  })
  const {
    watch,
    formState: { errors },
  } = form
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>بنرهای صفحه اصلی</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-4'>
          {fields.map((field, index) => (
            <div key={field.id} className='flex justify-between gap-1 w-full  '>
              <FormField
                control={form.control}
                name={`carousels.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>عنوان</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='عنوان بنر' />
                    </FormControl>
                    <FormMessage>
                      {errors.carousels?.[index]?.title?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`carousels.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>لینک</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='آدرس لینک' />
                    </FormControl>
                    <FormMessage>
                      {errors.carousels?.[index]?.url?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`carousels.${index}.buttonCaption`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>متن دکمه</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='متن دکمه' />
                    </FormControl>
                    <FormMessage>
                      {errors.carousels?.[index]?.buttonCaption?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <div>
                <FormField
                  control={form.control}
                  name={`carousels.${index}.image`}
                  render={({ field }) => (
                    <FormItem>
                      {index == 0 && <FormLabel>تصویر</FormLabel>}

                      <FormControl>
                        <Input placeholder='آدرس تصویر را وارد کنید' {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watch(`carousels.${index}.image`) && (
                  <Image
                    src={watch(`carousels.${index}.image`)}
                    alt='image'
                    className=' w-full object-cover object-center rounded-sm'
                    width={192}
                    height={68}
                  />
                )}
                {!watch(`carousels.${index}.image`) && (
                  <UploadButton
                    endpoint='imageUploader'
                    onClientUploadComplete={(res) => {
                      form.setValue(`carousels.${index}.image`, res[0].url)
                    }}
                    onUploadError={(error: Error) => {
                      toast({
                        variant: 'destructive',
                        description: `خطا ${error.message}`,
                      })
                    }}
                  />
                )}
              </div>
              <div>
                {index == 0 && <div>عملیات</div>}
                <Button
                  type='button'
                  disabled={fields.length === 1}
                  variant='outline'
                  className={index == 0 ? 'mt-2' : ''}
                  onClick={() => {
                    remove(index)
                  }}
                >
                  <TrashIcon className='w-4 h-4' />
                </Button>
              </div>
            </div>
          ))}

          <Button
            type='button'
            variant={'outline'}
            onClick={() =>
              append({ url: '', title: '', image: '', buttonCaption: '' })
            }
          >
            افزودن بنر جدید
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
