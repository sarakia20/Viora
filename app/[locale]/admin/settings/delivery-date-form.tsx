/* eslint-disable react-hooks/exhaustive-deps */
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ISettingInput } from '@/types'
import { TrashIcon } from 'lucide-react'
import React, { useEffect } from 'react'
import { useFieldArray, UseFormReturn } from 'react-hook-form'

export default function DeliveryDateForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'availableDeliveryDates',
  })
  const {
    setValue,
    watch,
    control,
    formState: { errors },
  } = form

  const availableDeliveryDates = watch('availableDeliveryDates')
  const defaultDeliveryDate = watch('defaultDeliveryDate')

  useEffect(() => {
    const validCodes = availableDeliveryDates.map((lang) => lang.name)
    if (!validCodes.includes(defaultDeliveryDate)) {
      setValue('defaultDeliveryDate', '')
    }
  }, [JSON.stringify(availableDeliveryDates)])

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>روش‌های ارسال</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-4'>
          {fields.map((field, index) => (
            <div key={field.id} className='flex gap-2'>
              <FormField
                control={form.control}
                name={`availableDeliveryDates.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>عنوان روش ارسال</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='مثال: ارسال عادی' />
                    </FormControl>
                    <FormMessage>
                      {errors.availableDeliveryDates?.[index]?.name?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`availableDeliveryDates.${index}.daysToDeliver`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>مدت تحویل (روز)</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='تعداد روز' />
                    </FormControl>
                    <FormMessage>
                      {
                        errors.availableDeliveryDates?.[index]?.daysToDeliver
                          ?.message
                      }
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`availableDeliveryDates.${index}.shippingPrice`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>هزینه ارسال</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='هزینه ارسال' />
                    </FormControl>
                    <FormMessage>
                      {
                        errors.availableDeliveryDates?.[index]?.shippingPrice
                          ?.message
                      }
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`availableDeliveryDates.${index}.freeShippingMinPrice`}
                render={({ field }) => (
                  <FormItem>
                    {index == 0 && <FormLabel>حداقل مبلغ ارسال رایگان</FormLabel>}
                    <FormControl>
                      <Input {...field} placeholder='مبلغ ارسال رایگان' />
                    </FormControl>
                    <FormMessage>
                      {
                        errors.availableDeliveryDates?.[index]
                          ?.freeShippingMinPrice?.message
                      }
                    </FormMessage>
                  </FormItem>
                )}
              />
              <div>
                {index == 0 && <div className=''>عملیات</div>}
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
              </div>{' '}
            </div>
          ))}

          <Button
            type='button'
            variant={'outline'}
            onClick={() =>
              append({
                name: '',
                daysToDeliver: 0,
                shippingPrice: 0,
                freeShippingMinPrice: 0,
              })
            }
          >
            افزودن روش ارسال
          </Button>
        </div>

        <FormField
          control={control}
          name='defaultDeliveryDate'
          render={({ field }) => (
            <FormItem>
              <FormLabel>روش ارسال پیش‌فرض</FormLabel>
              <FormControl>
                <Select
                  value={field.value || ''}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='انتخاب روش ارسال' />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDeliveryDates
                      .filter((x) => x.name)
                      .map((lang, index) => (
                        <SelectItem key={index} value={lang.name}>
                          {lang.name} ({lang.name})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage>{errors.defaultDeliveryDate?.message}</FormMessage>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
