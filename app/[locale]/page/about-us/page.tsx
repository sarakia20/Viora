import { publicMetadata } from '@/lib/public-seo'
import { STORE_ADDRESS, STORE_ALTERNATE_NAME, STORE_LABEL, STORE_NAME, STORE_PHONE } from '@/lib/store-brand'

export const metadata = publicMetadata({
  title: `درباره ${STORE_LABEL} | تجهیزات ساختمان و آشپزخانه`,
  description: `با ${STORE_LABEL}، حوزه فعالیت در تجهیزات ساختمان، آشپزخانه و سرویس بهداشتی و راه‌های تماس و مراجعه حضوری در شهرری آشنا شوید.`,
  path: '/page/about-us',
  images: ['/images/viora-logo.png'],
})

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-3 py-6 text-right sm:px-4 sm:py-10">

      <div className="rounded-3xl bg-slate-900 text-white p-10 mb-8 text-center">
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">درباره ویورا</h1>
        <p className="text-slate-300">
          {STORE_NAME} ({STORE_ALTERNATE_NAME})، فروشگاه تخصصی تجهیزات ساختمان، آشپزخانه، سرویس بهداشتی و تأمین متریال بازسازی است.
        </p>
        <p className="mt-3 text-slate-300">
          از سال ۱۳۹۰ همراه مطمئن شما در تجهیزات ساختمانی
        </p>
      </div>

      <div className="space-y-6">

        {/* About */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">
            درباره ما
          </h2>

          <p className="text-slate-700 leading-8">
            ویورا از سال ۱۳۹۰ در زمینه فروش و تأمین تجهیزات ساختمانی فعالیت می‌کند.
            ما با بیش از یک دهه تجربه در بازار ایران تلاش کرده‌ایم محصولات باکیفیت،
            قیمت مناسب و خدمات قابل اعتماد را در اختیار مشتریان قرار دهیم.
          </p>
        </div>

        {/* Categories */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">
            زمینه فعالیت
          </h2>

          <ul className="grid md:grid-cols-2 gap-3 text-slate-700">
            <li className="bg-slate-50 p-3 rounded-lg">شیرآلات</li>
            <li className="bg-slate-50 p-3 rounded-lg">چینی آلات بهداشتی</li>
            <li className="bg-slate-50 p-3 rounded-lg">تجهیزات آشپزخانه</li>
            <li className="bg-slate-50 p-3 rounded-lg">کاشی و سرامیک</li>
          </ul>
        </div>

        {/* Why us */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">
            چرا ویورا؟
          </h2>

          <p className="text-slate-700 leading-8">
            ویورا با بیش از یک دهه تجربه، تلاش کرده انتخابی مطمئن برای مشتریان باشد.
            تمرکز ما بر کیفیت محصولات، قیمت مناسب و ارسال سریع به سراسر کشور است.
          </p>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-slate-900">
            تماس با ما
          </h2>

          <div className="space-y-3 text-slate-700">
            <p>📞 تلفن: {STORE_PHONE}</p>
            
            <p>📍آدرس: {STORE_ADDRESS}</p>
            
          </div>
        </div>

      </div>
    </main>
  )
}
