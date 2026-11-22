import type { IProduct } from '@/lib/db/models/product.model'
import styles from './product-information.module.css'
import Link from 'next/link'
import { getCategoryLandingPath } from '@/lib/category-config'
import ProductDescription from './product-description'

export default function ProductInformation({ product }: { product: IProduct }) {
  const categoryHref = getCategoryLandingPath(product.category) ??
    `/search?${new URLSearchParams({ category: product.category })}`
  const specifications = [
    ['برند', product.brand],
    ['دسته‌بندی', product.category],
    ['زیرمجموعه', product.subCategory],
    ['رنگ / مدل‌های قابل انتخاب', (product.variants?.length ? product.variants.map(v => v.color) : product.colors).join('، ')],
    ['سایزهای قابل انتخاب', product.sizes.join('، ')],
  ].filter(([, value]) => value?.trim())

  return (
    <section dir='rtl' aria-label='اطلاعات محصول' className={`${styles.information} mt-10 rounded-2xl border border-slate-200 bg-white sm:mt-14`}>
      <input className={styles.input} type='radio' name='product-information' id='info-description' defaultChecked />
      <input className={styles.input} type='radio' name='product-information' id='info-specifications' />
      <input className={styles.input} type='radio' name='product-information' id='info-faq' />
      <div className={styles.labels}>
        <label htmlFor='info-description'>توضیحات</label>
        <label htmlFor='info-specifications'>مشخصات فنی</label>
        <label htmlFor='info-faq'>سوالات متداول</label>
      </div>
      <div className={styles.panels}>
        <section className={styles.description} aria-labelledby='description-heading'>
          <h2 id='description-heading' className='mb-5 text-lg font-bold text-slate-900'>معرفی {product.name}</h2>
          <ProductDescription key={product.slug}>
            {product.description?.trim() ? product.description.split(/\r?\n/).filter(line => line.trim()).map((line, i) => <p key={i}>{line}</p>) : <p>توضیحاتی برای این محصول ثبت نشده است.</p>}
          </ProductDescription>
        </section>
        <section className={styles.specifications} aria-labelledby='specifications-heading'>
          <h2 id='specifications-heading' className='mb-5 text-lg font-bold text-slate-900'>مشخصات {product.name}</h2>
          <dl className='divide-y divide-slate-100 text-sm'>
            {specifications.map(([label, value]) => <div key={label} className='grid gap-2 py-4 sm:grid-cols-[180px_1fr] sm:gap-6'><dt className='text-slate-500'>{label}</dt><dd className='break-words font-medium leading-7 text-slate-800'>{label === 'دسته‌بندی' ? <Link href={categoryHref}>{value}</Link> : value}</dd></div>)}
          </dl>
          <p className='mt-5 text-sm leading-7 text-slate-500'>اطلاعات بالا بر اساس داده‌های ثبت‌شده محصول است. سایر جزئیات موجود را در بخش توضیحات مطالعه کنید.</p>
        </section>
        <section className={styles.faq} aria-labelledby='faq-heading'>
          <h2 id='faq-heading' className='mb-5 text-lg font-bold text-slate-900'>سوالات متداول</h2>
          <p className='text-sm leading-8 text-slate-600'>هنوز پرسش و پاسخی برای این محصول ثبت نشده است.</p>
        </section>
      </div>
    </section>
  )
}
