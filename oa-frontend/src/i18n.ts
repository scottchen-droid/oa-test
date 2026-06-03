import { createI18n } from 'vue-i18n'
import zhTW from './locales/zh-TW'
import zhCN from './locales/zh-CN'
import en from './locales/en'

export type SupportedLocale = 'zh-TW' | 'zh-CN' | 'en'

export const LOCALE_STORAGE_KEY = 'oa_locale'

export const SUPPORTED_LOCALES: { value: SupportedLocale; label: string }[] = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en',    label: 'English' },
]

function getInitialLocale(): SupportedLocale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale | null
  if (stored && ['zh-TW', 'zh-CN', 'en'].includes(stored)) return stored
  return 'zh-TW'
}

const i18n = createI18n({
  legacy: false,         // use Composition API mode
  locale: getInitialLocale(),
  fallbackLocale: 'zh-TW',
  messages: {
    'zh-TW': zhTW,
    'zh-CN': zhCN,
    en,
  },
})

export function setLocale(locale: SupportedLocale) {
  ;(i18n.global.locale as any).value = locale
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

export function getLocale(): SupportedLocale {
  return (i18n.global.locale as any).value as SupportedLocale
}

export default i18n
