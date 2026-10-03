import { useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import { useLanguage } from '../lib/i18n.js'
import { Icon } from './ui.js'
import { RegionMap } from './RegionMap.js'

const PAGE_SIZE = 6

// Each language is named in its own locale, so the list reads the same in every UI language
function nativeName(code) {
  try {
    const name = new Intl.DisplayNames(code, { type: 'language' }).of(code)
    return name ? name[0].toLocaleUpperCase(code) + name.slice(1) : code
  } catch { return code }
}

function LanguageBreakdown({ rows, format }) {
  const { t } = useLanguage()
  const [requested, setPage] = useState(1)
  const title = t('rank.geo.language')
  const total = rows.reduce((sum, row) => sum + row.total, 0)
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(requested, pages)
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return html`
    <article class="panel rank-board">
      <div class="rank-board-heading"><span class="eyebrow">${t('rank.geo.kicker')}</span>
        <h2>${title}</h2></div>
      <div class="rank-table-scroll">
        <table class="rank-table rank-table--plain">
          <caption class="sr-only">${title}</caption>
          <thead><tr><th scope="col">${title}</th>
            <th scope="col">${t('rank.total')}</th><th scope="col">${t('rank.geo.share')}</th></tr></thead>
          <tbody>${visible.length ? visible.map(row => {
            const name = nativeName(row.name)
            const share = total ? row.total / total : 0
            return html`
              <tr key=${row.name}>
                <th scope="row" class="rank-name" title=${name}><span>${name}</span></th>
                <td>${format(row.total)}</td>
                <td><span class="rank-share"><span class="rank-share-track"><span class="rank-share-bar" style=${`--share:${share}`}></span></span><span class="rank-share-value">${format(share, 'percent')}</span></span></td>
              </tr>
            `
          }) : html`<tr><td colSpan="3" class="rank-empty">${t('rank.geo.emptyLanguage')}</td></tr>`}</tbody>
        </table>
      </div>
      ${pages > 1 ? html`
        <nav class="rank-board-pagination" aria-label=${t('rank.geo.pagination.label')}>
          <span class="pagination-summary">${t('rank.geo.pagination.summary', { page: current, pages })}</span>
          <div class="pagination-buttons">
            <button type="button" disabled=${current === 1} aria-label=${t('rank.geo.pagination.previous')} onClick=${() => setPage(current - 1)}><${Icon} name="chevron-left" /></button>
            ${Array.from({ length: pages }, (_, index) => index + 1).map(number => html`
              <button key=${number} type="button" class=${number === current ? 'is-active' : ''}
                aria-label=${t('rank.geo.pagination.goToPage', { page: number })} aria-current=${number === current ? 'page' : undefined}
                onClick=${() => setPage(number)}>${number}</button>
            `)}
            <button type="button" disabled=${current === pages} aria-label=${t('rank.geo.pagination.next')} onClick=${() => setPage(current + 1)}><${Icon} name="chevron-right" /></button>
          </div>
        </nav>
      ` : null}
    </article>
  `
}

export function Audience({ countries, languages, format }) {
  return html`
    <section id="audience" class="rank-audience">
      <div class="rank-boards">
        <${RegionMap} rows=${countries || []} format=${format} />
        <${LanguageBreakdown} rows=${languages || []} format=${format} />
      </div>
    </section>
  `
}
