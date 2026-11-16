'use client'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createOrder } from '@/lib/actions/order.actions'
import { calculateTipaxTotals, SHIPPING_PAY_ON_DELIVERY, TIPAX_SHIPPING_METHOD } from '@/lib/shipping'
import { ShippingAddressSchema } from '@/lib/validator'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'

import { ShippingAddress } from '@/types'
import useIsMounted from '@/hooks/use-is-mounted'
import Link from 'next/link'
import useCartStore from '@/hooks/use-cart-store'
import useSettingStore from '@/hooks/use-setting-store'
import ProductPrice from '@/components/shared/product/product-price'

const iranProvinces = [
  'تهران',
  'البرز',
  'اصفهان',
  'فارس',
  'خراسان رضوی',
  'آذربایجان شرقی',
  'آذربایجان غربی',
  'گیلان',
  'مازندران',
  'خوزستان',
  'قم',
  'کرمان',
  'یزد',
  'هرمزگان',
  'کرمانشاه',
  'مرکزی',
]
const shippingAddressDefaultValues = {
  fullName: '',
  street: '',
  province: '',
  city: '',
 
  phone: '',
  postalCode: '',
  country: 'Iran',
}
    

const CheckoutForm = () => {
  const { toast } = useToast()
  const router = useRouter()
  const {
    setting: {
      site,
      availablePaymentMethods,
      defaultPaymentMethod,
    },
  } = useSettingStore()

  const {
    cart: {
      items,
      shippingAddress,
      paymentMethod = defaultPaymentMethod,
    },
    setShippingAddress,
    setPaymentMethod,
    updateItem,
    removeItem,
    clearCart,
  } = useCartStore()
  const isMounted = useIsMounted()
  const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calculateTipaxTotals(items)

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddressDefaultValues,
  })
  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = (values) => {
    setShippingAddress(values)
    setIsAddressSelected(true)
  }

 // useEffect(() => {
   // if (!isMounted || !shippingAddress) return
    //shippingAddressForm.setValue('fullName', shippingAddress.fullName)
    //shippingAddressForm.setValue('street', shippingAddress.street)
   // shippingAddressForm.setValue('city', shippingAddress.city)
  //  shippingAddressForm.setValue('country', shippingAddress.country)
  //  shippingAddressForm.setValue('postalCode', shippingAddress.postalCode)
   // shippingAddressForm.setValue('province', shippingAddress.province)
   // shippingAddressForm.setValue('phone', shippingAddress.phone)
  //}, [items, isMounted, router, shippingAddress, shippingAddressForm])

  const [isAddressSelected, setIsAddressSelected] = useState<boolean>(false)
  const [isPaymentMethodSelected, setIsPaymentMethodSelected] =
    useState<boolean>(false)

  const handlePlaceOrder = async () => {
    const res = await createOrder({
      items,
      shippingAddress,
      shippingMethod: TIPAX_SHIPPING_METHOD,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    })
    if (!res.success) {
      toast({
        description: res.message,
        variant: 'destructive',
      })
    } else {
      toast({
        description: res.message,
        variant: 'default',
      })
      clearCart()
      router.push(`/checkout/${res.data?.orderId}`)
    }
  }
  const handleSelectPaymentMethod = () => {
    setIsAddressSelected(true)
    setIsPaymentMethodSelected(true)
  }
  const handleSelectShippingAddress = () => {
    shippingAddressForm.handleSubmit(onSubmitShippingAddress)()
  }
  const CheckoutSummary = () => (
    <Card>
      <CardContent className='p-4'>
        
        

        <div>
          <div className='text-lg font-bold'>خلاصه سفارش</div>
<hr className='my-3 border-slate-200' />
<div className='space-y-3'>
  
  <div className='flex justify-between'>
    <span>کالاها:</span>
    <span>
      <ProductPrice price={itemsPrice} plain />
    </span>
  </div>

  <div className='border-t border-slate-200' />

  <div className='flex justify-between'>
    <span>روش ارسال:</span>
    <span>{TIPAX_SHIPPING_METHOD}</span>
  </div>

  <div className='flex justify-between'>
    <span>هزینه ارسال:</span>
    <span>
      {SHIPPING_PAY_ON_DELIVERY}
    </span>
  </div>

  <div className='border-t border-slate-300' />

  <div className='flex justify-between pt-2 font-bold text-lg'>
    <span>جمع کل:</span>
    <span>
      <ProductPrice price={totalPrice} plain />
    </span>
  </div>

</div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <main className='mx-auto w-full max-w-6xl highlight-link'>
      <div className='grid min-w-0 gap-4 md:grid-cols-4 md:gap-6'>
        <div className='md:col-span-3'>
          {/* shipping address */}
          <div>
            {isAddressSelected && shippingAddress ? (
              <div className='grid grid-cols-1 md:grid-cols-12    my-3  pb-3'>
                <div className='col-span-5 flex text-lg font-bold '>
                  <span className='w-8'>1 </span>
                  <span>آدرس تحویل</span>
                </div>
                <div className='col-span-5 '>
                  <p>
                    {shippingAddress.fullName} <br />
                    {shippingAddress.street} <br />
                    {`${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
                  </p>
                </div>
                <div className='col-span-2'>
                  <Button
                    variant={'outline'}
                    onClick={() => {
                      setIsAddressSelected(false)
                      setIsPaymentMethodSelected(true)
                    }}
                  >
                    ویرایش
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className='flex text-slate-900 text-lg font-bold my-2'>
                  <span className='w-8'>1 </span>
                  <span>اطلاعات گیرنده</span>
                </div>
                <Form {...shippingAddressForm}>
                  <form
                    method='post'
                    onSubmit={shippingAddressForm.handleSubmit(
                      onSubmitShippingAddress
                    )}
                    className='space-y-4'
                  >
                    <Card className='my-4 md:ml-8'>
                      <CardContent className='space-y-2 p-3 sm:p-4'>
                        <div className='text-lg font-bold mb-2'>
                           اطلاعات آدرس
                        </div>

                        <div className='flex flex-col gap-5 md:flex-row'>
                          <FormField
                            control={shippingAddressForm.control}
                            name='fullName'
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
                        </div>
                        <div>
                          <FormField
                            control={shippingAddressForm.control}
                            name='street'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>آدرس</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder='آدرس کامل'
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>


                         <FormField
                            control={shippingAddressForm.control}
                            name='province'
                            render={({ field }) => (
                              <FormItem className='w-full text-right' dir='rtl'>
                                <FormLabel>استان</FormLabel>
                                <FormControl>
                                  <Select
  dir='rtl'
  value={field.value}
  onValueChange={field.onChange}
>
  <SelectTrigger className='text-right justify-between' dir='rtl'>
    <SelectValue placeholder='استان' />
  </SelectTrigger>

  <SelectContent className='text-right' dir='rtl' align='start'>
    {iranProvinces.map((province) => (
      <SelectItem
        key={province}
        value={province}
        className='text-right justify-start pr-8 pl-2'
      >
        {province}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        <div className='flex flex-col gap-5 md:flex-row'>
                          <FormField
                            control={shippingAddressForm.control}
                            name='city'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>شهر</FormLabel>
                                <FormControl>
                                  <Input placeholder=' شهر' {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                         
                         
                        </div>
                        <div className='flex flex-col gap-5 md:flex-row'>
                          <FormField
                            control={shippingAddressForm.control}
                            name='postalCode'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>کد پستی</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder='کد پستی'
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shippingAddressForm.control}
                            name='phone'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel>شماره موبایل</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder='شماره موبایل'
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                      <CardFooter className='  p-4'>
                        <Button
                          type='submit'
                          className='rounded-full font-bold'
                        >
                          تایید آدرس
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                </Form>
              </>
            )}
          </div>
          {/* payment method */}
          <div className='border-y'>
            {isPaymentMethodSelected && paymentMethod ? (
              <div className='grid  grid-cols-1 md:grid-cols-12  my-3 pb-3'>
                <div className='flex text-lg font-bold  col-span-5'>
                  <span className='w-8'>2 </span>
                  <span>روش پرداخت</span>
                </div>
                <div className='col-span-5 '>
                  <p>{paymentMethod}</p>
                </div>
                <div className='col-span-2'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsPaymentMethodSelected(false)
                    }}
                  >
                    ویرایش
                  </Button>
                </div>
              </div>
            ) : isAddressSelected ? (
              <>
                <div className='flex text-slate-900 text-lg font-bold my-2'>
                  <span className='w-8'>2 </span>
                  <span>انتخاب روش پرداخت</span>
                </div>
                <Card className='md:ml-8 my-4'>
                  <CardContent className='p-4'>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value)}
                    >
                      {availablePaymentMethods.map((pm) => (
                        <div key={pm.name} className='flex items-center py-1 '>
                          <RadioGroupItem
                            value={pm.name}
                            id={`payment-${pm.name}`}
                          />
                          <Label
                            className='font-bold pl-2 cursor-pointer'
                            htmlFor={`payment-${pm.name}`}
                          >
                            {pm.name}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                  <CardFooter className='p-4'>
                    <Button
                      onClick={handleSelectPaymentMethod}
                      className='rounded-full font-bold'
                    >
                      تایید روش پرداخت
                    </Button>
                  </CardFooter>
                </Card>
              </>
            ) : (
              <div className='flex text-muted-foreground text-lg font-bold my-4 py-3'>
                <span className='w-8'>2 </span>
                <span>انتخاب روش پرداخت</span>
              </div>
            )}
          </div>
          {/* Items and the fixed shipping method */}
          <div>
            {isPaymentMethodSelected && isAddressSelected ? (
              <>
                <div className='flex text-slate-900 text-lg font-bold my-2'>
                  <span className='w-8'>3 </span>
                  <span>بررسی سفارش</span>
                </div>
                <Card className='md:ml-8'>
                  <CardContent className='p-4'>
                   <div className='mb-5 rounded-xl bg-slate-50 p-4 text-right'>
  <p className='font-bold text-slate-900'>زمان تقریبی تحویل</p>
  <p className='mt-1 text-sm text-slate-600'>
    سفارش شما پس از ثبت، توسط تیم فروش بررسی و در سریع‌ترین زمان ممکن ارسال می‌شود.
  </p>
</div>
                    <div className='grid md:grid-cols-2 gap-6'>

  {/* محصولات */}
  <div className='rounded-xl border border-slate-200 p-4'>
    <h3 className='mb-4 text-lg font-bold text-slate-900'>
      محصولات سفارش
    </h3>

    {items.map((item, _index) => (
      <div
        key={_index}
        className='flex min-w-0 flex-col gap-3 border-b py-3 last:border-b-0 xs:flex-row xs:gap-4'
      >
        <div className='relative w-16 h-16'>
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes='20vw'
            style={{ objectFit: 'contain' }}
          />
        </div>

        <div className='min-w-0 flex-1'>
          <p className='font-semibold'>
            {item.name}
            {item.color && `، ${item.color}`}
            {item.size && `، ${item.size}`}
          </p>

          <p className='font-bold'>
            <ProductPrice price={item.price} plain />
          </p>

          <div className='mt-3 flex w-fit items-center rounded-lg border border-slate-200 overflow-hidden'>
  <button
    type='button'
    onClick={() =>
      item.quantity <= 1
        ? removeItem(item)
        : updateItem(item, item.quantity - 1)
    }
    className='h-8 w-8 flex items-center justify-center hover:bg-slate-100 text-slate-600'
  >
    {item.quantity <= 1 ? (
      <Trash2 className='h-4 w-4 text-red-500' />
    ) : (
      <Minus className='h-4 w-4' />
    )}
  </button>

  <div className='w-10 text-center text-sm font-bold'>
    {item.quantity}
  </div>

  <button
    type='button'
    onClick={() => updateItem(item, item.quantity + 1)}
    disabled={item.quantity >= item.countInStock}
    className='h-8 w-8 flex items-center justify-center hover:bg-slate-100 text-slate-600 disabled:opacity-40'
  >
    <Plus className='h-4 w-4' />
  </button>
</div>
        </div>
      </div>
    ))}
  </div>

  {/* ارسال */}
  <div className='rounded-xl border border-slate-200 p-4'>
    <h3 className='mb-4 text-lg font-bold text-slate-900'>
      روش ارسال
    </h3>

    <RadioGroup value={TIPAX_SHIPPING_METHOD} dir='rtl' aria-label='??? ?????'>
      <div className='flex items-center rounded-lg border border-slate-200 p-3'>
        <RadioGroupItem value={TIPAX_SHIPPING_METHOD} id='shipping-tipax' disabled />
        <Label className='pr-3 flex-1' htmlFor='shipping-tipax'>
          <div className='font-semibold text-slate-900'>{TIPAX_SHIPPING_METHOD}</div>
          <div className='text-sm text-slate-500'>{SHIPPING_PAY_ON_DELIVERY}</div>
        </Label>
      </div>
    </RadioGroup>
  </div>

</div>
</CardContent>
                  <CardFooter className='p-4  border-t'>
  <Button onClick={handlePlaceOrder} className='w-full rounded-full px-8 font-bold sm:w-auto'>
    ثبت نهایی سفارش
  </Button>
</CardFooter>
                </Card>
              </>
            ) : (
              <div className='flex text-muted-foreground text-lg font-bold my-4 py-3'>
                <span className='w-8'>3 </span>
                <span>محصولات و ارسال</span>
              </div>
            )}
          </div>
          
          
        </div>
        <div className='hidden md:block'>
          <CheckoutSummary />
        </div>
      </div>
    </main>
  )
}
export default CheckoutForm
