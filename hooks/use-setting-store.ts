/* eslint-disable no-unused-vars */

import data from '@/lib/data'
import { ClientSetting, SiteCurrency } from '@/types'
import { create } from 'zustand'

interface SettingState {
  setting: ClientSetting
  setSetting: (newSetting: ClientSetting) => void
  getCurrency: () => SiteCurrency
  setCurrency: (currency: string) => void

  // ✅ new
  autoSetCurrencyByLocale: (locale: string) => void
}

const LOCALE_TO_CURRENCY: Record<string, string> = {
  fa: 'IRT',
  'fa-IR': 'IRT',
  ar: 'AED',
  fr: 'EUR',
  'fr-FR': 'EUR',
  'en-US': 'USD',
}

const useSettingStore = create<SettingState>((set, get) => ({
  setting: {
    ...data.settings[0],
    currency: data.settings[0].defaultCurrency,
  } as ClientSetting,

  setSetting: (newSetting: ClientSetting) => {
    set({
      setting: {
        ...newSetting,
        currency: newSetting.currency || get().setting.currency,
      },
    })
  },

  getCurrency: () => {
    return (
      get().setting.availableCurrencies.find(
        (c) => c.code === get().setting.currency
      ) || data.settings[0].availableCurrencies[0]
    )
  },

  setCurrency: (currency: string) => {
    set({ setting: { ...get().setting, currency } })
  },

  // ✅ auto currency selection
  autoSetCurrencyByLocale: (locale: string) => {
    const short = (locale || '').split('-')[0] // fa-IR -> fa
    const target = LOCALE_TO_CURRENCY[locale] || LOCALE_TO_CURRENCY[short]
    if (!target) return

    const exists = get().setting.availableCurrencies?.some((c) => c.code === target)
    if (!exists) return

    if (get().setting.currency !== target) {
      set({ setting: { ...get().setting, currency: target } })
    }
  },
}))

export default useSettingStore