import { html } from '../lib/html.js'
import { useScrolled } from '../lib/hooks.js'
import { languages, useLanguage } from '../lib/i18n.js'
import { useAppearance } from '../lib/appearance.js'
import { SideNav } from './SideNav.js'
import { Icon } from './ui.js'

const REPO_URL = 'https://github.com/journey-ad/Moe-Counter'

export function SiteHeader({ site, onTrack = () => {}, page = 'home' }) {
  const scrolled = useScrolled(8)
  const { language, pendingLanguage, setLanguage, t } = useLanguage()
  const { appearance, toggleAppearance } = useAppearance()
  const appearanceLabel = t(appearance === 'dark' ? 'appearance.switchToLight' : 'appearance.switchToDark')

  const handleBrandClick = (event) => {
    const party = window.party
    if (!party || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const source = new party.Rect(
      event.detail === 0 ? bounds.left + bounds.width / 2 : event.clientX,
      event.detail === 0 ? bounds.top + bounds.height / 2 : event.clientY
    )
    const emitter = party.sparkles(source, {
      count: party.variation.range(26, 38),
      speed: party.variation.range(110, 250),
      lifetime: party.variation.range(0.6, 1.1),
      size: party.variation.range(0.8, 1.6),
      shapes: 'star'
    })
    const applyTransform = emitter.renderer.applyTransform
    emitter.renderer.applyTransform = (particle, element) => {
      applyTransform({
        ...particle,
        location: particle.location.add(new party.Vector(window.scrollX, window.scrollY))
      }, element)
    }
  }

  return html`
    <header class="site-header ${scrolled ? 'is-scrolled' : ''}">
      <a class="brand" href=${page === 'rank' ? `${site}/` : '#top'} aria-label=${t('nav.home')}
        onClick=${handleBrandClick}>
        <span class="brand-mark" aria-hidden="true"><img src=${`${site}/favicon.png`} alt="" /></span>
        <span class="brand-text">Moe Counter<i>!</i></span>
      </a>
      <${SideNav} site=${site} page=${page} />
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
