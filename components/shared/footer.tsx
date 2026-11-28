import Link from 'next/link'
import { STORE_ADDRESS, STORE_LABEL, STORE_NAME, STORE_PHONE, STORE_SOCIAL } from '@/lib/store-brand'
import {
  BadgeCheck,
  Headphones,
  Truck,
  Instagram,
  Send,
} from 'lucide-react'

const services = [
  {
    title: 'ضمانت اصالت کالا',
    icon: BadgeCheck,
  },
  {
    title: 'پشتیبانی ۷ روز هفته',
    icon: Headphones,
  },
  {
    title: 'ارسال به سراسر کشور',
    icon: Truck,
  },
]

export default function Footer() {
  return (
    <>
      <div className='bg-slate-100'>
        <a
          href='#top'
          className='flex w-full items-center justify-center gap-2 py-4 text-sm font-medium text-slate-700 transition hover:bg-slate-200'
        >
          ↑ بازگشت به بالا
        </a>
      </div>

      <footer className='border-t border-slate-200 bg-white text-slate-600'>
        <div className='mx-auto max-w-7xl px-4 pb-4 pt-8'>
          <div className='mb-8 space-y-3 text-center text-sm text-slate-600'>
            <p>شماره تماس: {STORE_PHONE}</p>
            <p>آدرس: {STORE_ADDRESS}</p>
            <Link href='/page/about-us' className='inline-block underline'>
              درباره {STORE_NAME}
            </Link>
          </div>

          <div className='mx-auto mb-10 grid max-w-3xl grid-cols-1 gap-5 border-y border-slate-100 py-8 xs:grid-cols-3 xs:gap-3 sm:gap-6'>
            {services.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className='flex flex-col items-center justify-center gap-3 text-center'
                >
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600'>
                    <Icon className='h-7 w-7' />
                  </div>

                  <span className='text-xs font-medium text-slate-600'>
                    {item.title}
                  </span>
                </div>
              )
            })}
          </div>

          <div className='mb-8 pt-10 text-center'>
            <div className='relative flex flex-wrap items-center justify-center gap-x-6 gap-y-4'>
              <div className='flex items-center justify-center gap-5 border-e border-slate-200 py-2 pe-6 text-slate-400'>
                <p className='absolute top-[-2.5rem] whitespace-nowrap text-base font-bold text-slate-800'>
                  همراه ما باشید
                </p>

                <Link
                  href={STORE_SOCIAL.telegram}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:text-slate-700'
                >
                  <Send className='h-7 w-7' />
                </Link>

                <Link
                  href={STORE_SOCIAL.instagram}
                  target='_blank'
                  className='hover:text-slate-700'
                >
                  <Instagram className='h-7 w-7' />
                </Link>
              </div>
              <a
                href='https://trustseal.enamad.ir/?id=8118263&Code=Ogp2owDvh5jV0xbpTQKVeUaZzAVMctit'
                target='_blank'
                rel='noopener'
                referrerPolicy='origin'
                aria-label={`نماد اعتماد الکترونیکی ${STORE_LABEL}`}
                className='grid h-[70px] w-[70px] shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200'
              >
                <img
                  src='https://trustseal.enamad.ir/logo.aspx?id=8118263&Code=Ogp2owDvh5jV0xbpTQKVeUaZzAVMctit'
                  alt='اینماد'
                  referrerPolicy='origin'
                  width={70}
                  height={70}
                  loading='lazy'
                  className='h-full w-full object-contain text-xs leading-[68px]'
                  {...{ code: 'Ogp2owDvh5jV0xbpTQKVeUaZzAVMctit' }}
                />
              </a>
            </div>
          </div>

          <div className='border-t border-slate-100 pt-6 text-center text-xs leading-6 text-slate-400'>
            تمامی حقوق {STORE_LABEL} محفوظ است. استفاده از مطالب سایت فقط با ذکر
            منبع مجاز است.
          </div>
        </div>
      </footer>
    </>
  )
}
