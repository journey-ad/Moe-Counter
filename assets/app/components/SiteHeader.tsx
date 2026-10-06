import type { JSX } from 'preact'
import type { TrackEvent, PageName } from '../types'
import { useScrolled } from '../hooks/ui'
import { useLanguage } from '../hooks/useLanguage'
import { useAppearance } from '../hooks/useAppearance'
import { SideNav } from './SideNav'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Icon } from './ui'

const REPO_URL = 'https://github.com/journey-ad/Moe-Counter'

export function SiteHeader({
  site,
  onTrack = () => {},
  page = 'home'
}: {
  site: string
  onTrack?: TrackEvent
  page?: PageName
}) {
  const scrolled = useScrolled(8)
  const { t } = useLanguage()
  const { appearance, toggleAppearance } = useAppearance()
  const appearanceLabel = t(appearance === 'dark' ? 'appearance.switchToLight' : 'appearance.switchToDark')

  const handleBrandClick = (event: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
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
      applyTransform?.(
        {
          ...particle,
          location: particle.location.add(new party.Vector(window.scrollX, window.scrollY))
        },
        element
      )
    }
  }

  return (
    <header class={'site-header ' + (scrolled ? 'is-scrolled' : '')}>
      <a
        class="brand"
        href={page === 'rank' ? `${site}/` : '#top'}
        aria-label={t('nav.home')}
        onClick={handleBrandClick}
      >
        <span class="brand-mark" aria-hidden="true">
          <img src={`${site}/favicon.png`} alt="" />
        </span>
        <span class="brand-text">
          Moe Counter<i>!</i>
        </span>
      </a>
      <SideNav site={site} page={page} />
      <div class="header-actions">
        <LanguageSwitcher />
        <button
          class="header-icon appearance-toggle"
          type="button"
          aria-label={appearanceLabel}
          title={appearanceLabel}
          onClick={toggleAppearance}
        >
          <Icon name={appearance === 'dark' ? 'sun' : 'moon'} />
        </button>
        <a
          class="header-icon header-link"
          href={REPO_URL}
          target="_blank"
          rel="noopener"
          aria-label={t('nav.source')}
          title={t('nav.source')}
          onClick={() => onTrack('click', 'normal', 'go_github')}
        >
          <Icon name="github" />
        </a>
      </div>
    </header>
  )
}
