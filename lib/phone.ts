export const MOBILE_PHONE_ERROR = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود'

// Normalize digits only. Keep spaces, letters and punctuation for validation to reject.
export function normalizeMobileDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit >= '۰' ? 0x06f0 : 0x0660))
  )
}
