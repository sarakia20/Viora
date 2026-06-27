export const i18n = {
  locales: [
    { code: 'en-US', name: 'English', icon: '🇺🇸' },
    { code: 'fr', name: 'Français', icon: '🇫🇷' },
    { code: 'ar', name: 'العربية', icon: '🇸🇦' },
    { code: 'fa', name: 'فارسی', icon: '🇮🇷' } // ✅ اضافه شد
  ],
  defaultLocale: 'fa' // یا 'fa' اگر می‌خوای پیش‌فرض فارسی باشه
}

export const getDirection = (locale: string) => {
  return locale === 'ar' || locale === 'fa' ? 'rtl' : 'ltr'
}

export type I18nConfig = typeof i18n
export type Locale = I18nConfig['locales'][number]