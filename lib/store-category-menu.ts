import { getCategoryLandingPath } from '@/lib/category-config'
import { flushTankCategory, flushTankSubCategories } from '@/lib/flush-tank-catalog'

type CategoryItem = {
  title: string
  children?: string[]
}

export const categoryGroups: Record<string, CategoryItem[]> = {
  'چینی آلات بهداشتی': [
    {
      title: 'توالت فرنگی',
      children: [
        'توالت فرنگی یک تکه',
        'توالت فرنگی وال هنگ',
      ],
    },
    { title: 'توالت ایرانی' },
    { title: 'روشویی' },
  ],

  'تجهیزات آشپزخانه': [
    { title: 'هود' },
    {
      title: 'سینک',
      children: [
        'گرانیتی',
        'استیل توکار',
        'سینک های دست ساز',
      ],
    },
    {
      title: 'اجاق گاز',
      children: [
        'اجاق گاز استیل',
        'اجاق گاز شیشه‌ای',
        'اجاق گاز برقی',
      ],
    },
    { title: 'فر' },
    { title: 'ماکروویو' },
  ],

  شیرآلات: [
    { title: 'شیر آشپزخانه' },
    { title: 'شیر روشویی' },
    { title: 'ست شیرآلات' },
    { title: 'شیرآلات توکار' },
  ],

  'کاشی و سرامیک': [
    { title: 'کاشی' },
    { title: 'سرامیک' },
    { title: 'کاشی دیوار' },
    { title: 'سرامیک کف' },
  ],

  اکسسوری: [
    { title: 'جامایع' },
    { title: 'جا دستمال کاغذی' },
  ],

  'کف شور': [
    { title: 'کف شور خطی' },
    { title: 'کف شور مربعی' },
  ],

  [flushTankCategory]: flushTankSubCategories.map((title) => ({ title })),
}

export const usesSubCategoryLinks = (category: string) =>
  ['اکسسوری', 'شیرآلات', 'کف شور', 'چینی آلات بهداشتی', flushTankCategory].includes(category)

export const getCategoryHref = (category: string) =>
  getCategoryLandingPath(category) ??
  `/search?category=${encodeURIComponent(category)}`

export const getSubCategoryHref = (category: string, subCategory: string) =>
  getCategoryLandingPath(subCategory) ??
  `/search?category=${encodeURIComponent(category)}&subCategory=${encodeURIComponent(subCategory)}`
