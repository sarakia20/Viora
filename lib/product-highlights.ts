const technicalFacts = [
  /(?:نوع(?: نصب)?|طول|عرض|ارتفاع|عمق لگن|جنس(?: بدنه| قطعات)?|ظرفیت مخزن|سیستم تخلیه|خروجی به (?:کف|دیوار)\s*\(آکس\))\s*[:：]\s*[^\n،,•.]+?(?=\s+(?:طول|عرض|ارتفاع|برند|ساخت شرکت)\s*[:：]?|[\n،,•.]|$)/g,
  /(?:ابعاد\s+(?:حدود\s+)?[۰-۹٠-٩\d]+(?:\s*[×x]\s*[۰-۹٠-٩\d]+){1,2}|(?:آکس نصب|قطر خروجی|ضخامت ورق|عمق لگن|لگن عمیق|مقاومت حرارتی تا)\s+[۰-۹٠-٩\d]+)\s*(?:میلی|سانتی)[\s‌-]*(?:متری?|گراد)/g,
  /(?:طراحی پنج شعله|شعله پلوپز در قسمت (?:وسط|بغل)|قطعات ایتالیایی|جرقه[‌\s-]زن اتومات|سیستم ایمنی ترموکوپل(?: Ultra Rapid)?|صفحه استیل(?: دودی)?|صفحه شیشه[‌\s-]ای|[۰-۹٠-٩\d]+ ماه ضمانت)(?=\b|[\s،,.]|$)/g,
  /(?:سینک (?:دو لگنه توکار|توکار بدون لبه|توکار تک لگن|توکار)|امکان نصب لگن به صورت چپ یا راست|خاصیت آنتی[‌\s-]باکتریال|نصب دیواری|سیستم ریم[‌\s-]لس|سیستم تخلیه واش[‌\s-]داون|سیستم تخلیه کم[‌\s-]صدا|کاسه (?:مستطیلی|بیضی)|مخزن فوق[‌\s-]باریک|شاسی دو زمانه|طناب کششی)/g,
  /(?:طراحی دیواری|امکان استفاده از دو نوع مایع شوینده|قابلیت پر\s*کردن مخزن بدون جداسازی|امکان پر\s*کردن مخزن بدون جداسازی|قابلیت تعویض پمپ(?: بدون جداسازی از دیوار)?|دارای سیستم قفل|شناور دیافراگمی کم[‌\s-]صدا|[۰-۹٠-٩\d]+ سال (?:ضمانت تعویض قطعات|خدمات پس از فروش))/g,
  /(?:از نوع\s+((?:تخت|گود)[^\n،,.]*?)\s+است(?=\s|[.،,]|$))|(در سه درجه کیفیت عرضه می‌شود)/g,
]

const featureList = /[\n•●✓✔]+|[,،](?!\s*(?:عمومی|صنعتی|باکتریال)(?=[\s،,)]|$))|(?<![\d۰-۹٠-٩])\.|\.(?![\d۰-۹٠-٩])/u
const explicitFeature = /^(?:دارای|مجهز به|قابلیت|امکان|مناسب|نصب|سطح|بدنه|طراحی|همراه|عمر|مقاومت)\s+\S/

export function getProductHighlights(description?: string): string[] {
  if (!description?.trim()) return []

  const facts: string[] = []
  const seen = new Set<string>()
  function add(value: string) {
    const text = value.replace(/^\s*[-–—]\s*/, '').replace(/\s+/g, ' ')
      .replace(/\s*[:：]\s*/g, ': ').trim()
    if (text.length < 3 || text.length > 100 || !/[\p{L}]/u.test(text) ||
      /[<>]|https?:|^(?:خرید|برند\s*:|رنگ(?:‌بندی| بندی)?\s*:|ساخت شرکت|توضیحات|مشخصات فنی|ویژگی‌ها)/u.test(text)) return
    const key = text.replace(/[\s‌:،,.]/g, '').toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    facts.push(text)
  }

  const bullets = description.split(/[•●✓✔]/u)
  if (bullets.length > 1) {
    for (const bullet of bullets.slice(1)) {
      add(bullet.split(/(?:رنگ[‌ ]?بندی|مشاهده تصاویر)\s*[^:\n]*:|\n\s*\n/)[0])
    }
  } else {
    for (const line of description.split(/\r?\n/)) {
      if (!line.trim() || line.trim().length > 130 && !/[،,.]/.test(line)) continue
      const fragments = line.split(featureList)
      const isList = fragments.filter(fragment => fragment.trim()).length > 1 &&
        !/(?:این مدل|این محصول|انتخابی مناسب| گزینه‌ای مناسب|طراحی شده|کمک می‌کند|عرضه می‌شود|(?:^|\s)است(?:[.،,\s]|$))/.test(line)

      if (isList || description.includes('\n') || explicitFeature.test(line.trim())) {
        for (const fragment of fragments) {
          if (!/(?:این مدل|این محصول|انتخابی مناسب|از نوع|(?:^|\s)است\s*$)/.test(fragment)) add(fragment)
        }
      }
    }
    for (const pattern of technicalFacts) {
      for (const match of description.matchAll(pattern)) {
        const prefix = description.slice(0, match.index).split(/[\n.،,•]/).at(-1) ?? ''
        if (!/(?:بدون|فاقد)\s*$/.test(prefix)) add(match[1] || match[2] || match[0])
      }
    }
  }

  return facts.slice(0, 7)
}
