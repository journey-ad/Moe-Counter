import { useState } from 'preact/hooks'
import type { LanguageCode } from '../types'
import { useLanguage } from '../hooks/useLanguage'
import { languages } from '../lib/i18n'

export function LanguageSwitcher() {
  const { t, language, setLanguage } = useLanguage()
  const [pendingLanguage, setPendingLanguage] = useState<LanguageCode | null>(null)

  const changeLanguage = async (next: LanguageCode) => {
    if (pendingLanguage || next === language) return
    setPendingLanguage(next)
    try {
      await setLanguage(next)
    } catch (error) {
      console.error('Could not load language:', next, error)
    } finally {
      setPendingLanguage(null)
    }
  }

  return (
    <div class="language-switch" role="group" aria-label={t('common.language')} aria-busy={Boolean(pendingLanguage)}>
      {languages.map(({ code, label, name }) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-label={name}
          title={name}
          aria-pressed={language === code}
          class={language === code ? 'is-active' : ''}
          disabled={Boolean(pendingLanguage)}
          onClick={() => changeLanguage(code)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
