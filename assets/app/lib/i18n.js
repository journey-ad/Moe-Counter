import { createContext } from 'preact'
import { useCallback, useContext, useEffect, useRef, useState } from 'preact/hooks'
import { html } from './html.js'

export const languages = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'zh', label: '中', name: '中文' },
  { code: 'ja', label: '日', name: '日本語' }
]

const loaders = {
  en: () => import('../locales/en.js'),
  zh: () => import('../locales/zh.js'),
  ja: () => import('../locales/ja.js')
}
const messageCache = new Map()
const LanguageContext = createContext(null)

function loadMessages(language) {
  if (!messageCache.has(language)) {
    messageCache.set(language, loaders[language]().then(({ default: messages }) => messages).catch((error) => {
      messageCache.delete(language)
      throw error
    }))
  }
  return messageCache.get(language)
}

function readLanguage() {
  try {
    const saved = localStorage.getItem('moe-counter-language')
    if (languages.some(({ code }) => code === saved)) return saved
  } catch {}

  for (const locale of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const code = locale?.toLowerCase().split('-')[0]
    if (languages.some((language) => language.code === code)) return code
  }
  return 'en'
}

export async function loadInitialLanguage() {
  const language = readLanguage()
  try {
    return { language, messages: await loadMessages(language) }
  } catch {
    return { language: 'en', messages: await loadMessages('en') }
  }
}

export function LanguageProvider({ initialLocale, themeCount, page = 'home', children }) {
  const [{ language, messages }, setLocale] = useState(initialLocale)
  const [pendingLanguage, setPendingLanguage] = useState(null)
  const request = useRef(0)
  const t = useCallback((key, values = {}) => {
    const message = key.split('.').reduce((value, part) => value?.[part], messages)
    return typeof message === 'string' ? message.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match) : key
  }, [messages])

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
    const prefix = page === 'rank' ? 'rank.page' : 'page'
    document.title = t(`${prefix}.title`)
    document.querySelector('meta[name="description"]')?.setAttribute('content', t(`${prefix}.description`, { count: themeCount }))
    const skip = document.querySelector('.skip-link')
    if (skip) skip.textContent = t('common.skip')
  }, [language, themeCount, page, t])

  const changeLanguage = async (next) => {
    if (!languages.some(({ code }) => code === next)) return
    const currentRequest = ++request.current
    setPendingLanguage(next)
    try {
      const messages = await loadMessages(next)
      if (currentRequest !== request.current) return
      setLocale({ language: next, messages })
      try { localStorage.setItem('moe-counter-language', next) } catch {}
    } catch (error) {
      console.error('Could not load language:', next, error)
    } finally {
      if (currentRequest === request.current) setPendingLanguage(null)
    }
  }

  return html`<${LanguageContext.Provider} value=${{ language, pendingLanguage, setLanguage: changeLanguage, t }}>${children}<//>`
}

export function useLanguage() {
  return useContext(LanguageContext)
}
