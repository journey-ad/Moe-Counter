import { html } from '../lib/html.js'
import { Icon } from './ui.js'
import { useLanguage } from '../lib/i18n.js'

const REPO_URL = 'https://github.com/journey-ad/Moe-Counter'

export function SiteFooter({ site, themeCount }) {
  const { t } = useLanguage()
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
          <a href="#usage">${t('nav.usage')}</a>
          <a href="#tool">${t('nav.config')}</a>
          <a href="#themes">${t('nav.themes')}</a>
          <a href="#credits">${t('nav.credits')}</a>
          <a href=${REPO_URL} target="_blank" rel="noopener">${t('nav.source')}</a>
          <a
            href="https://github.com/journey-ad/Moe-Counter/issues/new?assignees=&labels=theme&projects=&template=contribute-theme.yml&title=%5BTheme%5D%3A+"
            target="_blank"
            rel="noopener"
          >${t('footer.contribute')}</a>
        </nav>
      </div>

      <div class="footer-bottom">
        <span>Moe Counter! · MIT License</span>
      </div>
    </footer>
  `
}
