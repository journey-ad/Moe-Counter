import { useEffect, useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import { Icon } from './ui.js'
import { useLanguage } from '../lib/i18n.js'

const REPO_URL = 'https://github.com/journey-ad/Moe-Counter'

export function SiteFooter({ site, themeCount, page = 'home', rpm }) {
  const { t, language } = useLanguage()
  const [siteRpm, setSiteRpm] = useState(null)
  useEffect(() => {
    if (page === 'rank') return
    const controller = new AbortController()
    let busy = false
    const load = async () => {
      if (busy || document.hidden) return
      busy = true
      try {
        const response = await fetch(`${site}/api/stats/summary`, { signal: controller.signal })
        if (!response.ok) return
        const data = await response.json()
        if (!controller.signal.aborted) setSiteRpm(data.site.rpm)
      } catch {} finally { busy = false }
    }
    load()
    const timer = setInterval(load, 60000)
    document.addEventListener('visibilitychange', load)
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', load) }
  }, [site, page])
  const currentRpm = page === 'rank' ? rpm : siteRpm
  const requestsPerMinute = Number.isFinite(currentRpm)
    ? new Intl.NumberFormat(language, { maximumSignificantDigits: 3 }).format(currentRpm)
    : '—'
  const home = page === 'rank' ? `${site}/` : ''
  return html`
    <footer class="site-footer">
      <div class="footer-top">
        <div class="footer-brand">
          <span class="brand-mark" aria-hidden="true"><img src=${`${site}/favicon.png`} alt="" /></span>
          <b>Moe Counter<i>!</i></b>
        </div>
        <p>${t('footer.description')}</p>
        <a class="footer-up" href="#top" aria-label=${t('nav.top')}>
          <${Icon} name="chevron-down" />
        </a>
      </div>

      <div class="footer-body">
        <p>
          ${t('footer.license')}<br />
          ${t('footer.communityThemes', { count: themeCount })}
        </p>
        <nav class="footer-links" aria-label=${t('footer.nav')}>
          <a href=${`${home}#usage`}>${t('nav.usage')}</a>
          <a href=${`${home}#tool`}>${t('nav.config')}</a>
          <a href=${`${home}#themes`}>${t('nav.themes')}</a>
          <a href=${`${home}#credits`}>${t('nav.credits')}</a>
          <a href=${`${site}/rank`}>${t('nav.rank')}</a>
          <a href=${REPO_URL} target="_blank" rel="noopener">${t('nav.source')}</a>
          <a
            href="https://github.com/journey-ad/Moe-Counter/issues/new?assignees=&labels=theme&projects=&template=contribute-theme.yml&title=%5BTheme%5D%3A+"
            target="_blank"
            rel="noopener"
          >${t('footer.contribute')}</a>
        </nav>
      </div>

      <div class="footer-bottom">
        <span>Moe Counter! ${t('footer.requestsPerMinute', { count: requestsPerMinute })}</span>
      </div>
    </footer>
  `
}
