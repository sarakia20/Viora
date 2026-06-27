'use server'

import { ISettingInput } from '@/types'
import data from '../data'
import Setting from '../db/models/setting.model'
import { connectToDatabase } from '../db'
import { formatError } from '../utils'
import { cookies } from 'next/headers'

const globalForSettings = global as unknown as {
  cachedSettings: ISettingInput | null
}

const isSkipDb = process.env.SKIP_DB === 'true'

export const getNoCachedSetting = async (): Promise<ISettingInput> => {
  if (isSkipDb) return data.settings[0] as ISettingInput

  await connectToDatabase()
  const setting = await Setting.findOne()
  return JSON.parse(JSON.stringify(setting)) as ISettingInput
}

export const getSetting = async (): Promise<ISettingInput> => {
  if (isSkipDb) return data.settings[0] as ISettingInput

  if (!globalForSettings.cachedSettings) {
    await connectToDatabase()
    const setting = await Setting.findOne().lean()
    globalForSettings.cachedSettings = setting
      ? JSON.parse(JSON.stringify(setting))
      : data.settings[0]
  }

  return globalForSettings.cachedSettings as ISettingInput
}

export const updateSetting = async (newSetting: ISettingInput) => {
  if (isSkipDb) {
    return {
      success: false,
      message: 'Database is disabled in design mode',
    }
  }

  try {
    await connectToDatabase()
    const updatedSetting = await Setting.findOneAndUpdate({}, newSetting, {
      upsert: true,
      new: true,
    }).lean()

    globalForSettings.cachedSettings = JSON.parse(
      JSON.stringify(updatedSetting)
    )

    return {
      success: true,
      message: 'Setting updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export const setCurrencyOnServer = async (newCurrency: string) => {
  'use server'

  const cookiesStore = await cookies()
  cookiesStore.set('currency', newCurrency)

  return {
    success: true,
    message: 'Currency updated successfully',
  }
}
