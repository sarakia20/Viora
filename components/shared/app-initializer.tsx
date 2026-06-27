'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import useSettingStore from '@/hooks/use-setting-store'
import { ClientSetting } from '@/types'

export default function AppInitializer({
  setting,
  children,
}: {
  setting: ClientSetting
  children: React.ReactNode
}) {
  const locale = useLocale()
  const { setSetting, autoSetCurrencyByLocale } = useSettingStore()

  // 1) hydrate store with server setting
  useEffect(() => {
    setSetting(setting)
  }, [setting, setSetting])

  // 2) auto currency by locale (fa -> IRT, en -> USD, ...)
  useEffect(() => {
    autoSetCurrencyByLocale(locale)
  }, [locale, autoSetCurrencyByLocale])

  return <>{children}</>
}