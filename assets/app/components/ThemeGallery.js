import { useRef, useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import { useInView } from '../lib/hooks.js'
import { Icon, SectionHead, Tag } from './ui.js'
import { useLanguage } from '../lib/i18n.js'

const PAGE_SIZE = 20
const ZOOM_FILL = 0.9
const PAN_EDGE = 0.86

function ThemeCard({ theme, site, selected, onUse }) {
  const { t } = useLanguage()
  const [ref, inView] = useInView()
  const [status, setStatus] = useState('idle')
  const stageRef = useRef(null)
  const imgRef = useRef(null)
  const previewUrl = `${site}/@demo?theme=${encodeURIComponent(theme.name)}&darkmode=0`

  // Scale is derived from layout boxes, so it stays stable while the pointer moves
  const trackPointer = (clientX) => {
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

  return html`
    <li ref=${ref} class="theme-card ${selected ? 'is-selected' : ''}"
      onMouseEnter=${(event) => trackPointer(event.clientX)}
      onMouseMove=${(event) => trackPointer(event.clientX)}
      onMouseLeave=${releasePointer}
    >
      <div class="theme-stage" ref=${stageRef}>
        ${inView && status !== 'failed'
          ? html`
              <img
                ref=${imgRef}
                src=${previewUrl}
                loading="lazy"
                decoding="async"
                alt=${t('themes.preview.alt', { name: theme.name })}
                class=${status === 'ready' ? 'is-ready' : ''}
                onLoad=${() => setStatus('ready')}
                onError=${() => setStatus('failed')}
              />
            `
          : null}
        ${status === 'failed'
          ? html`<p class="theme-failed">${t('themes.preview.failed')}</p>`
          : null}
      </div>
      <div class="theme-card-body">
        <div class="theme-card-name">
          <h3>${theme.name}</h3>
          ${theme.groups.includes('animated') ? html`<${Tag} tone="animated">${t('themes.animated')}<//>` : null}
        </div>
        <button
          class="theme-use"
          type="button"
          aria-pressed=${selected}
          onClick=${() => onUse(theme.name)}
        >
          <${Icon} name=${selected ? 'check' : 'arrow-up-right'} />${t(selected ? 'themes.selected' : 'themes.use')}
        </button>
      </div>
    </li>
  `
}

export function ThemeGallery({ site, groups, themes, currentTheme, onUseTheme }) {
  const { t } = useLanguage()
  const [keyword, setKeyword] = useState('')
  const [group, setGroup] = useState('')
  const [page, setPage] = useState(1)

  const key = keyword.trim().toLowerCase()
  const visible = themes.filter((theme) => {
    if (group && !theme.groups.includes(group)) return false
    return !key || theme.name.toLowerCase().includes(key)
  })

  const countOf = (id) => themes.filter((theme) => theme.groups.includes(id)).length
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pagedThemes = visible.slice(start, start + PAGE_SIZE)

  const selectGroup = (next) => { setGroup(next); setPage(1) }
  const changePage = (next) => {
    setPage(next)
    document.querySelector('.theme-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return html`
    <section id="themes" class="section">
      <${SectionHead}
        index="03"
        title=${t('themes.title')}
        note=${t('themes.note', { count: themes.length })}
      />

      <p class="lede">
        ${t('themes.intro')}
      </p>

      <div class="theme-tools">
        <div class="theme-search">
          <${Icon} name="search" />
          <input
            type="search"
            value=${keyword}
            placeholder=${t('themes.search.placeholder')}
            aria-label=${t('themes.search.label')}
            onInput=${(event) => { setKeyword(event.currentTarget.value); setPage(1) }}
          />
        </div>

        <div class="theme-filters" role="group" aria-label=${t('themes.filters')}>
          <button
            type="button"
            class=${group === '' ? 'is-active' : ''}
            aria-pressed=${group === ''}
            onClick=${() => selectGroup('')}
          >
            ${t('themes.all')}<b>${themes.length}</b>
          </button>
          ${groups.map(
            (item) => html`
              <button
                key=${item.id}
                type="button"
                class=${group === item.id ? 'is-active' : ''}
                aria-pressed=${group === item.id}
                onClick=${() => selectGroup(item.id)}
              >
                ${t(`themes.groups.${item.id}`)}<b>${countOf(item.id)}</b>
              </button>
            `
          )}
        </div>

        <span class="theme-count" aria-live="polite">
          ${visible.length ? t('themes.showing', { start: start + 1, end: start + pagedThemes.length, total: visible.length }) : t('themes.resultsCount', { count: 0 })}
        </span>
      </div>

      ${visible.length
        ? html`
            <ul class="theme-grid">
              ${pagedThemes.map(
                (theme) => html`
                  <${ThemeCard}
                    key=${theme.name}
                    theme=${theme}
                    site=${site}
                    selected=${currentTheme === theme.name}
                    onUse=${onUseTheme}
                  />
                `
              )}
            </ul>
          `
        : html`<div class="theme-empty"><${Icon} name="search" /><p>${t('themes.empty')}</p>
            <button type="button" class="text-button" onClick=${() => { setKeyword(''); selectGroup('') }}>${t('themes.clearFilters')}</button>
          </div>`}

      ${pages > 1 ? html`
        <nav class="theme-pagination" aria-label=${t('themes.pagination.label')}>
          <span class="pagination-summary">${t('themes.pagination.summary', { page: currentPage, pages })}</span>
          <div class="pagination-buttons">
            <button type="button" disabled=${currentPage === 1} aria-label=${t('themes.pagination.previous')} onClick=${() => changePage(currentPage - 1)}><${Icon} name="chevron-left" /></button>
            ${Array.from({ length: pages }, (_, index) => index + 1).map((number) => html`
              <button key=${number} type="button" class=${number === currentPage ? 'is-active' : ''}
                aria-label=${t('themes.pagination.goToPage', { page: number })} aria-current=${number === currentPage ? 'page' : undefined}
                onClick=${() => changePage(number)}>${number}</button>
            `)}
            <button type="button" disabled=${currentPage === pages} aria-label=${t('themes.pagination.next')} onClick=${() => changePage(currentPage + 1)}><${Icon} name="chevron-right" /></button>
          </div>
        </nav>
      ` : null}
    </section>
  `
}
