# مرحله اول اصلاح تصاویر محصولات ویورا

تاریخ بررسی ۴ آذر ۱۴۰۵. منبع سنجش تولید، HTML خام ۱۲۳ صفحه محصول در sitemap و درخواست مستقیم GET به CDN یا سرور دامنه بود. مقایسه با Liara در سطح فایل‌های عمومی انجام شد.

| شاخص | تعداد |
|---|---:|
| URL یکتای بررسی‌شده در کاتالوگ عمومی | 223 |
| سالم با GET و پاسخ تصویر | 175 |
| خراب با GET و قابل اصلاح با فایل موجود | 48 |
| فایل هم‌مسیر موجود و untracked در میان ۴۸ مورد | 39 |
| مسیر اشتباه با مقصد موجود، tracked و سالم در تولید | 9 |
| فایل واقعاً مفقود در میان ۴۸ مورد | 0 |
| عکس‌های کاتالوگ عمومی که در Git ثبت نشده‌اند، شامل URLهای سالم تولید | 47 |
| کل فایل‌های untracked در public/images، شامل placeholder | 48 |
| کل فایل‌های فعلی public/images و زیرپوشه‌ها | 246 |

هر ۴۸ فایل متناظر محلی با Sharp رمزگشایی شدند. ۹ مقصد اصلاحی با GET پاسخ `200 image/webp` داشتند و محتوای دریافت‌شده بایت‌به‌بایت با فایل workspace یکسان بود. در ۳۹ مورد، نام فایل و حروف دقیقاً با مسیر درخواست تطبیق دارند. برای ۹ مورد دیگر فقط بخش `/products/` اضافه بود و نام، حروف و پسوند فایل ثابت ماند.

اتصال خواندنی از طریق `.env.local` موفق بود، ولی collection محصولات در پایگاه پیکربندی‌شده خالی بود. مسیرهای جدول از Product Schema، Open Graph و در صورت وجود، فیلدهای عمومی `images` و `variants` در payload نسخه تولید استخراج شده‌اند. هیچ مسیر خامی به عنوان مقدار تأییدشده MongoDB تولید گزارش نشده است.

## فهرست کامل URLهای ناسالم

تمام مسیرهای ستون «فعلی» نسبت به `https://viora-store.ir` هستند. «ثبت نشده» در ستون فایل به وضعیت Git اشاره دارد. برای ۹ مورد، ستون آخر مسیر پیشنهادی MongoDB را نشان می‌دهد، مشروط به اینکه مقدار فعلی پس از دسترسی خواندنی به دیتابیس تولید تأیید شود.

| ردیف | نام محصول | برند | Slug | رنگ یا درجه | مسیر فعلی | HTTP | Content-Type | کاربرد | فایل موجود و مسیر پیشنهادی |
|---:|---|---|---|---|---|---:|---|---|---|
| 1 | شیر ظرفشویی دومنظوره الوند مدل بامبو | الوند | `alvand-bamboo-dual-kitchen-faucet` | مشکی | `/images/bamboo-dual-black.webp` | 404 | `text/html; charset=utf-8` | اصلی، واریانت، Schema، OG اصلی | `public/images/bamboo-dual-black.webp`، ثبت‌نشده |
| 2 | شیر ظرفشویی دومنظوره الوند مدل بامبو | الوند | `alvand-bamboo-dual-kitchen-faucet` | کروم | `/images/bamboo-dual-chrome.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/bamboo-dual-chrome.webp`، ثبت‌نشده |
| 3 | شیر ظرفشویی دومنظوره الوند مدل بامبو | الوند | `alvand-bamboo-dual-kitchen-faucet` | طلایی | `/images/bamboo-dual-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/bamboo-dual-gold.webp`، ثبت‌نشده |
| 4 | شیر ظرفشویی دومنظوره الوند مدل بامبو | الوند | `alvand-bamboo-dual-kitchen-faucet` | کروم_مات | `/images/bamboo-dual-matte-chrome.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/bamboo-dual-matte-chrome.webp`، ثبت‌نشده |
| 5 | شیر ظرفشویی دومنظوره الوند مدل بامبو | الوند | `alvand-bamboo-dual-kitchen-faucet` | طلامات | `/images/bamboo-dual-matte-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/bamboo-dual-matte-gold.webp`، ثبت‌نشده |
| 6 | شیر ظرفشویی دومنظوره الوند مدل بامبو | الوند | `alvand-bamboo-dual-kitchen-faucet` | سفیدطلایی | `/images/bamboo-dual-white-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/bamboo-dual-white-gold.webp`، ثبت‌نشده |
| 7 | پک قبل از کاشی کاری فلاش تانک روکار لوله پنهان ایمن آب (سارودی) | ایمن آب | `imenab-pre-tiling-kit` | در داده عمومی مشخص نیست | `/images/imenab-pre-tiling-kit.webp` | 404 | `text/html; charset=utf-8` | Schema، OG اصلی | `public/images/imenab-pre-tiling-kit.webp`، ثبت‌نشده |
| 8 | کیت استراکچر وال هنگ فلاش تانک روکار ایمن آب (سارودی) | ایمن آب | `imenab-wall-hung-structure-kit` | در داده عمومی مشخص نیست | `/images/imenab-wall-hung-structure-kit.webp` | 404 | `text/html; charset=utf-8` | Schema، OG اصلی | `public/images/imenab-wall-hung-structure-kit.webp`، ثبت‌نشده |
| 9 | فلاش تانک روکار ایمن آب مدل پرشین سارودی | ایمن آب | `flash-tank-imenab-persian` | مشکی | `/images/products/flash-tank-imenab-persian-black.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `/images/flash-tank-imenab-persian-black.webp`، tracked و سالم در تولید |
| 10 | فلاش تانک روکار ایمن آب مدل پرشین سارودی | ایمن آب | `flash-tank-imenab-persian` | تیتانیوم | `/images/products/flash-tank-imenab-persian-titanium.webp` | 404 | `text/html; charset=utf-8` | اصلی، واریانت، Schema، OG اصلی | `/images/flash-tank-imenab-persian-titanium.webp`، tracked و سالم در تولید |
| 11 | فلاش تانک روکار ایمن آب مدل پرشین سارودی | ایمن آب | `flash-tank-imenab-persian` | سفید کروم | `/images/products/flash-tank-imenab-persian-white-chrome.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `/images/flash-tank-imenab-persian-white-chrome.webp`، tracked و سالم در تولید |
| 12 | فلاش تانک روکار ایمن آب مدل پرشین سارودی | ایمن آب | `flash-tank-imenab-persian` | سفید طلایی | `/images/products/flash-tank-imenab-persian-white-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `/images/flash-tank-imenab-persian-white-gold.webp`، tracked و سالم در تولید |
| 13 | جامایع دوقلو سارودی مدل آلما | سارودی | `sarodi-alma-double-soap-dispenser` | طلایی براق | `/images/products/sarodi-alma-shiny-gold.webp` | 404 | `text/html; charset=utf-8` | واریانت، Schema، OG | `/images/sarodi-alma-shiny-gold.webp`، tracked و سالم در تولید |
| 14 | جامایع دوقلو سارودی مدل آلما | سارودی | `sarodi-alma-double-soap-dispenser` | تیتانیوم کلید کروم | `/images/products/sarodi-alma-titanium-chrome.webp` | 404 | `text/html; charset=utf-8` | واریانت، Schema، OG | `/images/sarodi-alma-titanium-chrome.webp`، tracked و سالم در تولید |
| 15 | جامایع دوقلو سارودی مدل آلما | سارودی | `sarodi-alma-double-soap-dispenser` | سفید کلید کروم | `/images/products/sarodi-alma-white-chrome.webp` | 404 | `text/html; charset=utf-8` | واریانت، Schema، OG | `/images/sarodi-alma-white-chrome.webp`، tracked و سالم در تولید |
| 16 | جامایع دوقلو سارودی مدل آلما | سارودی | `sarodi-alma-double-soap-dispenser` | سفید کلید طلایی | `/images/products/sarodi-alma-white-gold.webp` | 404 | `text/html; charset=utf-8` | واریانت، Schema، OG | `/images/sarodi-alma-white-gold.webp`، tracked و سالم در تولید |
| 17 | جامایع دوقلو سارودی مدل آلما | سارودی | `sarodi-alma-double-soap-dispenser` | سفید | `/images/products/sarodi-alma-white.webp` | 404 | `text/html; charset=utf-8` | واریانت، Schema، OG اصلی | `/images/sarodi-alma-white.webp`، tracked و سالم در تولید |
| 18 | صفحه کلید فلاش تانک توکار سارودی مدل آرال 100 | سارودی | `sarodi-aral-100-flush-plate` | استیل طلایی خش دار | `/images/sarodi-aral-100-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-aral-100-gold.webp`، ثبت‌نشده |
| 19 | صفحه کلید فلاش تانک توکار سارودی مدل آرال 100 | سارودی | `sarodi-aral-100-flush-plate` | استیل خش دار | `/images/sarodi-aral-100-steel.webp` | 404 | `text/html; charset=utf-8` | اصلی، واریانت، Schema، OG اصلی | `public/images/sarodi-aral-100-steel.webp`، ثبت‌نشده |
| 20 | فلاش تانک روکار ایمن آب (سارودی) مدل اروند | ایمن آب | `flash-tank-sarodi-arvand` | سفید کروم | `/images/sarodi-arvand.webp` | 404 | `text/html; charset=utf-8` | اصلی، واریانت، Schema، OG اصلی | `public/images/sarodi-arvand.webp`، ثبت‌نشده |
| 21 | فلاش تانک توکار زمینی سارودی مدل کلیک | سارودی | `sarodi-click-ground-flush-tank` | سفید | `/images/sarodi-click-ground.webp` | 404 | `text/html; charset=utf-8` | اصلی، واریانت، Schema، OG اصلی | `public/images/sarodi-click-ground.webp`، ثبت‌نشده |
| 22 | فلاش تانک توکار وال هنگ سارودی مدل کلیک | سارودی | `sarodi-click-wall-hung-flush-tank` | در داده عمومی مشخص نیست | `/images/sarodi-click-wall-hung.webp` | 404 | `text/html; charset=utf-8` | Schema، OG اصلی | `public/images/sarodi-click-wall-hung.webp`، ثبت‌نشده |
| 23 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل کریستا | ایمن آب | `sarodi-crysta-flush-plate` | مشکی | `/images/sarodi-crysta-black.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-crysta-black.webp`، ثبت‌نشده |
| 24 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل کریستا | ایمن آب | `sarodi-crysta-flush-plate` | سفید | `/images/sarodi-crysta-white.webp` | 404 | `text/html; charset=utf-8` | اصلی، واریانت، Schema، OG اصلی | `public/images/sarodi-crysta-white.webp`، ثبت‌نشده |
| 25 | صفحه کلید فلاش تانک توکار سارودی مدل فلت | سارودی | `sarodi-flat-flush-plate` | مشکی | `/images/sarodi-flat-black.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-flat-black.webp`، ثبت‌نشده |
| 26 | صفحه کلید فلاش تانک توکار سارودی مدل فلت | سارودی | `sarodi-flat-flush-plate` | کروم | `/images/sarodi-flat-chrome.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-flat-chrome.webp`، ثبت‌نشده |
| 27 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل فلت فرون | ایمن آب | `sarodi-flat-front-flush-plate` | استیل طلایی خش دار | `/images/sarodi-flat-front-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-flat-front-gold.webp`، ثبت‌نشده |
| 28 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل فلت فرون | ایمن آب | `sarodi-flat-front-flush-plate` | استیل خش دار | `/images/sarodi-flat-front-steel.webp` | 404 | `text/html; charset=utf-8` | اصلی، واریانت، Schema، OG اصلی | `public/images/sarodi-flat-front-steel.webp`، ثبت‌نشده |
| 29 | صفحه کلید فلاش تانک توکار سارودی مدل فلت | سارودی | `sarodi-flat-flush-plate` | سفید کروم | `/images/sarodi-flat-white-chrome.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-flat-white-chrome.webp`، ثبت‌نشده |
| 30 | صفحه کلید فلاش تانک توکار سارودی مدل فلت | سارودی | `sarodi-flat-flush-plate` | سفید طلایی | `/images/sarodi-flat-white-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-flat-white-gold.webp`، ثبت‌نشده |
| 31 | صفحه کلید فلاش تانک توکار سارودی مدل فلت | سارودی | `sarodi-flat-flush-plate` | سفید | `/images/sarodi-flat-white.webp` | 404 | `text/html; charset=utf-8` | اصلی، واریانت، Schema، OG اصلی | `public/images/sarodi-flat-white.webp`، ثبت‌نشده |
| 32 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل هماک | ایمن آب | `sarodi-hamak-flush-plate` | مشکی | `/images/sarodi-hamak-black.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-hamak-black.webp`، ثبت‌نشده |
| 33 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل هماک | ایمن آب | `sarodi-hamak-flush-plate` | آبی نفتی | `/images/sarodi-hamak-blue.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-hamak-blue.webp`، ثبت‌نشده |
| 34 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل هماک | ایمن آب | `sarodi-hamak-flush-plate` | مرجانی | `/images/sarodi-hamak-coral.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-hamak-coral.webp`، ثبت‌نشده |
| 35 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل هماک | ایمن آب | `sarodi-hamak-flush-plate` | طلایی مات | `/images/sarodi-hamak-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-hamak-gold.webp`، ثبت‌نشده |
| 36 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل هماک | ایمن آب | `sarodi-hamak-flush-plate` | نقره ای | `/images/sarodi-hamak-silver.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-hamak-silver.webp`، ثبت‌نشده |
| 37 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل هماک | ایمن آب | `sarodi-hamak-flush-plate` | فیروزه ای | `/images/sarodi-hamak-turquoise.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-hamak-turquoise.webp`، ثبت‌نشده |
| 38 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل هماک | ایمن آب | `sarodi-hamak-flush-plate` | سفید | `/images/sarodi-hamak-white.webp` | 404 | `text/html; charset=utf-8` | اصلی، واریانت، Schema، OG اصلی | `public/images/sarodi-hamak-white.webp`، ثبت‌نشده |
| 39 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل پلنت | ایمن آب | `sarodi-planet-flush-plate` | مشکی کروم | `/images/sarodi-planet-black-chrome.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-planet-black-chrome.webp`، ثبت‌نشده |
| 40 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل پلنت | ایمن آب | `sarodi-planet-flush-plate` | مشکی طلایی | `/images/sarodi-planet-black-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-planet-black-gold.webp`، ثبت‌نشده |
| 41 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل پلنت | ایمن آب | `sarodi-planet-flush-plate` | آبی نفتی | `/images/sarodi-planet-blue.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-planet-blue.webp`، ثبت‌نشده |
| 42 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل پلنت | ایمن آب | `sarodi-planet-flush-plate` | مرجانی | `/images/sarodi-planet-coral.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-planet-coral.webp`، ثبت‌نشده |
| 43 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل پلنت | ایمن آب | `sarodi-planet-flush-plate` | طلایی مات رینگ کروم | `/images/sarodi-planet-gold-chrome.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-planet-gold-chrome.webp`، ثبت‌نشده |
| 44 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل پلنت | ایمن آب | `sarodi-planet-flush-plate` | طلایی رینگ طلایی | `/images/sarodi-planet-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-planet-gold.webp`، ثبت‌نشده |
| 45 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل پلنت | ایمن آب | `sarodi-planet-flush-plate` | تیتانیوم | `/images/sarodi-planet-titanium.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-planet-titanium.webp`، ثبت‌نشده |
| 46 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل پلنت | ایمن آب | `sarodi-planet-flush-plate` | فیروزه ای | `/images/sarodi-planet-turquoise.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-planet-turquoise.webp`، ثبت‌نشده |
| 47 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل پلنت | ایمن آب | `sarodi-planet-flush-plate` | سفید کروم | `/images/sarodi-planet-white-chrome.webp` | 404 | `text/html; charset=utf-8` | اصلی، واریانت، Schema، OG اصلی | `public/images/sarodi-planet-white-chrome.webp`، ثبت‌نشده |
| 48 | صفحه کلید فلاش تانک توکار ایمن آب (سارودی) مدل پلنت | ایمن آب | `sarodi-planet-flush-plate` | سفید طلایی | `/images/sarodi-planet-white-gold.webp` | 404 | `text/html; charset=utf-8` | گالری، واریانت، Schema، OG | `public/images/sarodi-planet-white-gold.webp`، ثبت‌نشده |

## پوشش تصاویر واریانت و انتشار

- هر ۴۸ URL در Product Schema و Open Graph دیده شد. ۱۴ مورد تصویر اول OG بودند. برای ۴۵ مورد، رنگ از payload محصول به‌دست آمد و در سه مورد رنگ در داده عمومی مشخص نبود.
- 28 URL یکتای مرتبط با درجه‌بندی شناسایی شد. همه پاسخ سالم داشتند. تنها مسیرهای درجه‌ای که در داده عمومی با تصویر صریح در دسترس بودند در این شمارش آمده‌اند.
- هر شش فایل بامبو دومنظوره با فایل رنگ متناظر بامبو معمولی از نظر بایت متفاوت‌اند. هیچ فایل یا مسیر بین این دو محصول جابه‌جا نشد.
- هشت فایل دیگر در Git ثبت نشده‌اند و مسیرشان همین حالا در تولید سالم است. بسته انتشار این فایل‌ها را هم باید حفظ کند.

- `public/images/emp56.webp`
- `public/images/imenab-hidden-pipe-kit-gold.webp`
- `public/images/imenab-hidden-pipe-kit-titanium.webp`
- `public/images/imenab-hidden-pipe-kit.webp`
- `public/images/morvarid-emperial-68.webp`
- `public/images/morvarid-gloria-67.webp`
- `public/images/morvarid-verona-61.webp`
- `public/images/sarodi-aras.webp`

## حجم تصاویر

| تصویر عمومی | حجم فعلی فایل اصلی | هدف پیشنهادی |
|---|---:|---|
| `/images/ST-628-classic.webp` | 1645596 بایت | ۲۰۰ تا ۳۵۰ KiB برای نسخه نمایشی WebP، با کنترل خوانایی جزئیات |
| `/images/ST-628-steel.webp` | 1733247 بایت | ۲۰۰ تا ۳۵۰ KiB برای نسخه نمایشی WebP، با کنترل خوانایی جزئیات |
| `/images/ST-628-ultra.webp` | 1598140 بایت | ۲۰۰ تا ۳۵۰ KiB برای نسخه نمایشی WebP، با کنترل خوانایی جزئیات |
| `/images/banner-bathroom.jpg`، بنر خارج از ۲۲۳ تصویر محصول | 1782136 بایت | ۱۵۰ تا ۲۵۰ KiB برای نسخه اصلی نمایشی و ۸۰ تا ۱۵۰ KiB برای نسخه موبایل |

برای کارت‌ها حدود ۴۰ تا ۹۰ KiB و برای thumbnailها حدود ۱۰ تا ۳۰ KiB هدف اولیه است. کیفیت جزئیات و رنگ را در نمایش واقعی بررسی کنید. فایل اصلی باکیفیت می‌تواند برای بزرگ‌نمایی جداگانه استفاده شود. در این مرحله فایل‌های تصویری دوباره فشرده نشدند.

## اجرای کنترل سلامت

اسکریپت با Node.js 22.18 یا جدیدتر و Git اجرا می‌شود و گزارش JSON را روی stdout می‌نویسد. شکست تصویر، نبود تصویر لازم، خطای صفحه و نبود فایل tracked مورد نیاز در کاتالوگ MongoDB به خروج با کد ۱ منجر می‌شود.

```powershell
# کنترل قبل از انتشار با کاتالوگ خواندنی محیط مورد نظر
node --env-file=.env.local scripts/check-product-images.cjs --mongo --local-only
# کنترل HTTP روی یک نسخه در دسترس، پیش‌فرض دامنه تولید
node scripts/check-product-images.cjs
# تطبیق منابع داده و نسخه آنلاین
node --env-file=.env.local scripts/check-product-images.cjs --mongo
```

برای بررسی staging، `PRODUCT_IMAGE_ORIGIN` را روی دامنه آن بگذارید. اگر نام پایگاه مورد نظر در URI پیش‌فرض نیست، `PRODUCT_IMAGE_DB` را تنظیم کنید. کنترل محلی، فایل‌های هم‌نام با تفاوت حروف، پسوند یا پوشه را به‌عنوان کاندیدا گزارش می‌کند. خود اسکریپت هیچ جایگزینی، تغییر دیتابیس، stage یا انتشار انجام نمی‌دهد.

## نتیجه تغییر کد

۹ نگاشت دقیق در resolver مشترک گالری، Product Schema و Open Graph اضافه شد. همان نگاشت‌ها در Next.js مسیرهای قدیمی را مستقیماً به فایل صحیح می‌رسانند تا لینک‌های قبلی هم پس از انتشار پاسخ تصویر بگیرند. هر ۳۹ فایل هم‌مسیر با نسخه ثبت‌شده در شاخه مبنای انتشار از نظر بایت یکسان بود. آمار HTTP این گزارش مربوط به نسخه قبل از انتشار اصلاحات است. MongoDB، فایل عکس، قیمت، موجودی، slug و رفتار انتخاب واریانت دست‌نخورده ماندند.

۴۱ تست مرتبط موفق بودند. یک کنترل جداگانه تأیید کرد که resolver برای هر ۴۸ مورد به مسیر دقیق یک فایل محلی موجود می‌رسد. اجرای کنترل آنلاین کد خروج ۱ داد، چون خرابی‌های تولید را تشخیص داد. کنترل محلی MongoDB نیز به دلیل خالی بودن کاتالوگ پایگاه پیکربندی‌شده، کد خروج ۱ داد.
