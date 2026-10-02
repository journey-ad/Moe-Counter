import { html } from '../lib/html.js'
import { useScrolled } from '../lib/hooks.js'
import { languages, useLanguage } from '../lib/i18n.js'
import { useAppearance } from '../lib/appearance.js'
import { SideNav } from './SideNav.js'
import { Icon } from './ui.js'

const REPO_URL = 'https://github.com/journey-ad/Moe-Counter'

export function SiteHeader({ site, onTrack }) {
  const scrolled = useScrolled(8)
  const { language, pendingLanguage, setLanguage, t } = useLanguage()
  const { appearance, toggleAppearance } = useAppearance()
  const appearanceLabel = t(appearance === 'dark' ? 'appearance.switchToLight' : 'appearance.switchToDark')

  return html`
    <header class="site-header ${scrolled ? 'is-scrolled' : ''}">
      <a class="brand" href="#top" aria-label=${t('nav.home')}>
        <span class="brand-mark" aria-hidden="true"><img src=${`${site}/favicon.png`} alt="" /></span>
        <span class="brand-text">Moe Counter<i>!</i></span>
      </a>
      <${SideNav} />
      <div class="header-actions">
        <div class="language-switch" role="group" aria-label=${t('common.language')} aria-busy=${Boolean(pendingLanguage)}>
          ${languages.map(({ code, label, name }) => html`
            <button key=${code} type="button" lang=${code} aria-label=${name}
              title=${name} aria-pressed=${language === code}
              class=${language === code ? 'is-active' : ''}
              onClick=${() => setLanguage(code)}>${label}</button>
          `)}
        </div>
        <button class="header-icon appearance-toggle" type="button" aria-label=${appearanceLabel}
          title=${appearanceLabel} onClick=${toggleAppearance}>
          <${Icon} name=${appearance === 'dark' ? 'sun' : 'moon'} />
        </button>
        <a class="header-icon header-link" href=${REPO_URL} target="_blank" rel="noopener"
          aria-label=${t('nav.source')} title=${t('nav.source')}
          onClick=${() => onTrack('click', 'normal', 'go_github')}>
          <${Icon} name="github" />
        </a>
      </div>
    </header>
  `
}
