import Link from 'next/link'
import {
  BadgeCheck,
  Headphones,
  Truck,
  Instagram,
  MessageCircle,
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
        <div className='mx-auto max-w-7xl px-4 py-8'>
          <div className='mb-8 space-y-3 text-center text-sm text-slate-600'>
            <p>شماره تماس: 09102145452</p>
            <p>
              آدرس: تهران، شهرری، خیابان غیوری شمالی، بالاتر از چهارراه خط آهن،
              نبش کوچه بیاتی، پلاک ۶۲
            </p>
          </div>

          <div className='mx-auto mb-10 grid max-w-3xl grid-cols-3 gap-6 border-y border-slate-100 py-8'>
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

          <div className='mb-8 text-center'>
            <h3 className='mb-4 text-base font-bold text-slate-800'>
              همراه ما باشید
            </h3>

            <div className='flex items-center justify-center gap-5 text-slate-400'>
              <Link
                href='https://instagram.com'
                target='_blank'
                className='hover:text-slate-700'
              >
                <Instagram className='h-7 w-7' />
              </Link>

              <Link
  href='https://t.me/Viora_RM'
  target='_blank'
  rel='noopener noreferrer'
  className='hover:text-slate-700'
>
  <Send className='h-7 w-7' />
</Link>

              <Link
                href='https://wa.me/989xxxxxxxxx'
                target='_blank'
                className='hover:text-slate-700'
              >
                <MessageCircle className='h-7 w-7' />
              </Link>

              <Link
                href='https://ble.ir'
                target='_blank'
                className='hover:text-slate-700'
              >
                <div className='flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs font-bold'>
                  ب
                </div>
              </Link>
            </div>
          </div>

          <div className='border-t border-slate-100 pt-6 text-center text-xs leading-6 text-slate-400'>
            تمامی حقوق این فروشگاه محفوظ است. استفاده از مطالب سایت فقط با ذکر
            منبع مجاز است.
          </div>
        </div>
      </footer>
    </>
  )
}