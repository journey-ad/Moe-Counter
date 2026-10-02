import { html } from '../lib/html.js'
import { useScrollSpy } from '../lib/hooks.js'
import { useLanguage } from '../lib/i18n.js'

const NAV_ITEMS = [
  { id: 'usage', label: 'nav.usage' },
  { id: 'tool', label: 'nav.config' },
  { id: 'themes', label: 'nav.themes' },
  { id: 'credits', label: 'nav.credits' }
]

export function SideNav({ site, page = 'home' }) {
  const active = useScrollSpy(NAV_ITEMS.map(({ id }) => id))
  const { t } = useLanguage()

  return html`
    <nav class="side-nav" aria-label=${t('nav.label')}>
      ${NAV_ITEMS.map(({ id, label }) => html`
        <a key=${id} href=${page === 'home' ? `#${id}` : `${site}/#${id}`} class=${page === 'home' && active === id ? 'is-active' : ''}
          aria-current=${page === 'home' && active === id ? 'location' : undefined}>${t(label)}</a>
      `)}
      <a href=${`${site}/rank`} class=${page === 'rank' ? 'is-active' : ''} aria-current=${page === 'rank' ? 'page' : undefined}>${t('nav.rank')}</a>
    </nav>
  `
}
