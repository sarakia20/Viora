// Some saved orders/settings use the Persian name for the ZarinPal method.
// Keep this allowlist exact; other online providers must not be routed to ZarinPal.
export function isZarinPalPaymentMethod(method: string | undefined) {
  return method === 'ZarinPal' || method === 'پرداخت آنلاین'
}
