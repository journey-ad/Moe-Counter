import { useTranslation } from 'react-i18next'
import type { LanguageCode, Translate } from '../types'

export function useLanguage() {
  const { t, i18n } = useTranslation()
  return {
    language: (i18n.resolvedLanguage || 'en') as LanguageCode,
    t: t as Translate,
    setLanguage: (language: LanguageCode) => i18n.changeLanguage(language)
  }
}
