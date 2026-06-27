export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 text-right">

      <div className="rounded-3xl bg-slate-900 text-white p-10 mb-8 text-center">
        <h1 className="text-3xl font-bold mb-3">درباره ویورا</h1>
        <p className="text-slate-300">
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
            <p>📞 تلفن: 09102145452</p>
            
            <p>📍آدرس: تهران، شهرری، خیابان غیوری شمالی، بالاتر از چهارراه خط آهن، نبش کوچه بیاتی، پلاک ۶۲</p>
            
          </div>
        </div>

      </div>
    </main>
  )
}