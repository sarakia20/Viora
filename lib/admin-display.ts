const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
const arabicDigits = '٠١٢٣٤٥٦٧٨٩'

export function formatAdminDigits(value: string) {
  return value.replace(/[0-9٠-٩]/g, (digit) => {
    const arabicIndex = arabicDigits.indexOf(digit)
    return persianDigits[arabicIndex === -1 ? Number(digit) : arabicIndex]
  })
}

const adminDateTime = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Tehran',
})

export function formatAdminDateTime(value: Date) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'ثبت نشده' : adminDateTime.format(date)
}
