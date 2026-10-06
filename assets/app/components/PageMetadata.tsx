import { useEffect } from 'preact/hooks'
import type { PageName } from '../types'
import { useLanguage } from '../hooks/useLanguage'

export function PageMetadata({
  themeCount,
  page,
  name
}: {
  themeCount: number
  page: PageName
  name: string
}) {
  const { t, language } = useLanguage()
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
    const prefix = page === 'rank' || page === 'view' ? `${page}.page` : 'page'
    document.title = t(`${prefix}.title`, { name })
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t(`${prefix}.description`, { count: themeCount, name }))
    const skip = document.querySelector('.skip-link')
    if (skip) skip.textContent = t('common.skip')
  }, [language, themeCount, page, name, t])

  return null
}
