// These catalog paths still appear in saved variants. Each WebP is the
// corresponding original photo for the same model and finish.
const legacyProductImages = new Map([
  ['/images/Alvand_corom.png', '/images/alvand-chrome-kitchen-faucet.webp'],
  ['/images/Alvand_talai.png', '/images/alvand-gold-kitchen-faucet.webp'],
  ['/images/Alvand_corom_mat.png', '/images/alvand-matte-chrome-kitchen-faucet.webp'],
  ['/images/Alvand_talamat.png', '/images/Alvand_talamat.webp'],
  ['/images/T_one_corom.png', '/images/t-one-chrome-kitchen-faucet.webp'],
  ['/images/T_one_meshki.png', '/images/t-one-black-kitchen-faucet.webp'],
  ['/images/Eone_corom.png', '/images/e-one-chrome-kitchen-faucet.webp'],
  ['/images/Eone_meshki_talai.png', '/images/e-one-black-gold-kitchen-faucet.webp'],
  ['/images/Eone_talai.png', '/images/e-one-gold-kitchen-faucet.webp'],
  ['/images/Eone_corom_mat.png', '/images/e-one-chrome-matte-kitchen-faucet.webp'],
  ['/images/anlo_corom.png', '/images/anlo_corom.webp'],
  ['/images/anlo_meshki.png', '/images/anlo_meshki.webp'],
  ['/images/anlo_talai.png', '/images/anlo_talai.webp'],
  ['/images/anlo_talai_mat.png', '/images/anlo_talai_mat.webp'],
  ['/images/harmoni_corom.png', '/images/harmoni_corom.webp'],
  ['/images/harmoni_corommat.png', '/images/harmoni_corommat.webp'],
  ['/images/harmoni_sefid_talai.png', '/images/harmoni_sefid_talai.webp'],
  ['/images/harmoni_talai.png', '/images/harmoni_talai.webp'],
  ['/images/harmoni_talamat.png', '/images/harmoni_talamat.webp'],
])

const directGalleryImages = new Set([
  ...legacyProductImages.values(),
  '/images/mix-plus-e6507.webp',
])

export function resolveProductImage(src: string) {
  return legacyProductImages.get(src) ?? src
}

export function isDirectGalleryImage(src: string) {
  return directGalleryImages.has(src)
}
