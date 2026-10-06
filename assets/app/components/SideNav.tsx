import type { PageName } from '../types'
import { useScrollSpy } from '../hooks/ui'
import { useLanguage } from '../hooks/useLanguage'

const NAV_ITEMS = [
  { id: 'usage', label: 'nav.usage' },
  { id: 'tool', label: 'nav.config' },
  { id: 'themes', label: 'nav.themes' },
  { id: 'credits', label: 'nav.credits' }
]

export function SideNav({ site, page = 'home' }: { site: string; page?: PageName }) {
  const active = useScrollSpy(NAV_ITEMS.map(({ id }) => id))
  const { t } = useLanguage()

  return (
    <nav class="side-nav" aria-label={t('nav.label')}>
      {NAV_ITEMS.map(({ id, label }) => (
        <a
          key={id}
          href={page === 'home' ? `#${id}` : `${site}/#${id}`}
          class={page === 'home' && active === id ? 'is-active' : ''}
          aria-current={page === 'home' && active === id ? 'location' : undefined}
        >
          {t(label)}
        </a>
      ))}
      <a
        href={`${site}/rank`}
        class={page === 'rank' ? 'is-active' : ''}
        aria-current={page === 'rank' ? 'page' : undefined}
      >
        {t('nav.rank')}
      </a>
    </nav>
  )
}
