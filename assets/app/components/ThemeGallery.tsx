import type { Theme, ThemeGroup } from '../types'
import { useRef, useState } from 'preact/hooks'
import { useInView } from '../hooks/ui'
import { Icon, SectionHead, Tag } from './ui'
import { useLanguage } from '../hooks/useLanguage'

const PAGE_SIZE = 20
const ZOOM_FILL = 0.9
const PAN_EDGE = 0.86

function ThemeCard({
  theme,
  site,
  selected,
  onUse
}: {
  theme: Theme
  site: string
  selected: boolean
  onUse: (name: string) => void
}) {
  const { t } = useLanguage()
  const [ref, inView] = useInView<HTMLLIElement>()
  const [status, setStatus] = useState('idle')
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const previewUrl = `${site}/@demo?theme=${encodeURIComponent(theme.name)}&darkmode=0`

  // Scale is derived from layout boxes, so it stays stable while the pointer moves
  const trackPointer = (clientX: number) => {
    const stage = stageRef.current
    const img = imgRef.current
    if (!stage || !img || !img.offsetHeight) return
    const box = stage.getBoundingClientRect()
    const zoom = (stage.clientHeight * ZOOM_FILL) / img.offsetHeight
    const slide = Math.max(0, img.offsetWidth * zoom - stage.clientWidth)
    const ratio = box.width ? Math.min(1, Math.max(0, (clientX - box.left) / box.width)) : 0.5
    const progress = Math.min(1, Math.max(-1, (ratio - 0.5) / (PAN_EDGE - 0.5)))
    img.style.setProperty('--zoom', String(zoom))
    img.style.setProperty('--pan', `${(-progress * slide) / 2}px`)
  }

  const releasePointer = () => {
    const img = imgRef.current
    if (!img) return
    img.style.setProperty('--zoom', '1')
    img.style.setProperty('--pan', '0px')
  }

  return (
    <li
      ref={ref}
      class={'theme-card ' + (selected ? 'is-selected' : '')}
      onMouseEnter={(event) => trackPointer(event.clientX)}
      onMouseMove={(event) => trackPointer(event.clientX)}
      onMouseLeave={releasePointer}
    >
      <div class="theme-stage" ref={stageRef}>
        {inView && status !== 'failed' ? (
          <img
            ref={imgRef}
            src={previewUrl}
            loading="lazy"
            decoding="async"
            alt={t('themes.preview.alt', {
              name: theme.name
            })}
            class={status === 'ready' ? 'is-ready' : ''}
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('failed')}
          />
        ) : null}
        {status === 'failed' ? <p class="theme-failed">{t('themes.preview.failed')}</p> : null}
      </div>
      <div class="theme-card-body">
        <div class="theme-card-name">
          <h3>{theme.name}</h3>
          {theme.groups.includes('animated') ? <Tag tone="animated">{t('themes.animated')}</Tag> : null}
        </div>
        <button class="theme-use" type="button" aria-pressed={selected} onClick={() => onUse(theme.name)}>
          <Icon name={selected ? 'check' : 'arrow-up-right'} />
          {t(selected ? 'themes.selected' : 'themes.use')}
        </button>
      </div>
    </li>
  )
}

export function ThemeGallery({
  site,
  groups,
  themes,
  currentTheme,
  onUseTheme
}: {
  site: string
  groups: ThemeGroup[]
  themes: Theme[]
  currentTheme: string
  onUseTheme: (name: string) => void
}) {
  const { t } = useLanguage()
  const [keyword, setKeyword] = useState('')
  const [group, setGroup] = useState('')
  const [page, setPage] = useState(1)

  const key = keyword.trim().toLowerCase()
  const visible = themes.filter((theme) => {
    if (group && !theme.groups.includes(group)) return false
    return !key || theme.name.toLowerCase().includes(key)
  })

  const countOf = (id: string) => themes.filter((theme) => theme.groups.includes(id)).length
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pagedThemes = visible.slice(start, start + PAGE_SIZE)

  const selectGroup = (next: string) => {
    setGroup(next)
    setPage(1)
  }
  const changePage = (next: number) => {
    setPage(next)
    document.querySelector('.theme-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="themes" class="section">
      <SectionHead
        index="03"
        title={t('themes.title')}
        note={t('themes.note', {
          count: themes.length
        })}
      />
      <p class="lede">{t('themes.intro')}</p>
      <div class="theme-tools">
        <div class="theme-search">
          <Icon name="search" />
          <input
            type="search"
            value={keyword}
            placeholder={t('themes.search.placeholder')}
            aria-label={t('themes.search.label')}
            onInput={(event) => {
              setKeyword(event.currentTarget.value)
              setPage(1)
            }}
          />
        </div>
        <div class="theme-filters" role="group" aria-label={t('themes.filters')}>
          <button
            type="button"
            class={group === '' ? 'is-active' : ''}
            aria-pressed={group === ''}
            onClick={() => selectGroup('')}
          >
            {t('themes.all')}
            <b>{themes.length}</b>
          </button>
          {groups.map((item) => (
            <button
              key={item.id}
              type="button"
              class={group === item.id ? 'is-active' : ''}
              aria-pressed={group === item.id}
              onClick={() => selectGroup(item.id)}
            >
              {t(`themes.groups.${item.id}`)}
              <b>{countOf(item.id)}</b>
            </button>
          ))}
        </div>
        <span class="theme-count" aria-live="polite">
          {visible.length
            ? t('themes.showing', {
                start: start + 1,
                end: start + pagedThemes.length,
                total: visible.length
              })
            : t('themes.resultsCount', {
                count: 0
              })}
        </span>
      </div>
      {visible.length ? (
        <ul class="theme-grid">
          {pagedThemes.map((theme) => (
            <ThemeCard
              key={theme.name}
              theme={theme}
              site={site}
              selected={currentTheme === theme.name}
              onUse={onUseTheme}
            />
          ))}
        </ul>
      ) : (
        <div class="theme-empty">
          <Icon name="search" />
          <p>{t('themes.empty')}</p>
          <button
            type="button"
            class="text-button"
            onClick={() => {
              setKeyword('')
              selectGroup('')
            }}
          >
            {t('themes.clearFilters')}
          </button>
        </div>
      )}
      {pages > 1 ? (
        <nav class="theme-pagination" aria-label={t('themes.pagination.label')}>
          <span class="pagination-summary">
            {t('themes.pagination.summary', {
              page: currentPage,
              pages
            })}
          </span>
          <div class="pagination-buttons">
            <button
              type="button"
              disabled={currentPage === 1}
              aria-label={t('themes.pagination.previous')}
              onClick={() => changePage(currentPage - 1)}
            >
              <Icon name="chevron-left" />
            </button>
            {Array.from(
              {
                length: pages
              },
              (_, index) => index + 1
            ).map((number) => (
              <button
                key={number}
                type="button"
                class={number === currentPage ? 'is-active' : ''}
                aria-label={t('themes.pagination.goToPage', {
                  page: number
                })}
                aria-current={number === currentPage ? 'page' : undefined}
                onClick={() => changePage(number)}
              >
                {number}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === pages}
              aria-label={t('themes.pagination.next')}
              onClick={() => changePage(currentPage + 1)}
            >
              <Icon name="chevron-right" />
            </button>
          </div>
        </nav>
      ) : null}
    </section>
  )
}
