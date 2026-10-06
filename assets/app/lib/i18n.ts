import i18n from 'i18next'
import type { ResourceLanguage } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import type { LanguageCode } from '../types'

export const languages: { code: LanguageCode; label: string; name: string }[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'zh', label: '中', name: '中文' },
  { code: 'ja', label: '日', name: '日本語' }
]

const loaders = {
  en: () => import('../locales/en'),
  zh: () => import('../locales/zh'),
  ja: () => import('../locales/ja')
}

export const i18nReady = i18n
  .use(LanguageDetector)
  .use(resourcesToBackend((language: string) => loaders[language as LanguageCode]()))
  .use(initReactI18next)
  .init({
    supportedLngs: languages.map(({ code }) => code),
    fallbackLng: 'en',
    load: 'languageOnly',
    returnNull: false,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'moe-counter-language',
      caches: ['localStorage']
    },
    interpolation: { prefix: '{', suffix: '}', escapeValue: false },
    react: { useSuspense: false, bindI18nStore: 'added removed' }
  })

if (import.meta.hot) {
  import.meta.hot.accept(['../locales/en', '../locales/zh', '../locales/ja'], ([en, zh, ja]) => {
    const updates: [LanguageCode, ResourceLanguage | undefined][] = [
      ['en', en?.default],
      ['zh', zh?.default],
      ['ja', ja?.default]
    ]
    for (const [language, messages] of updates) {
      if (!messages) continue
      i18n.removeResourceBundle(language, 'translation')
      i18n.addResourceBundle(language, 'translation', messages)
    }
  })
}

export { i18n }
