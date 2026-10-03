import { useEffect, useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import { useNumberFormat } from '../lib/hooks.js'
import { useLanguage } from '../lib/i18n.js'
import { SiteHeader } from './SiteHeader.js'
import { SiteFooter } from './SiteFooter.js'
import { BackToTop } from './BackToTop.js'
import { Icon } from './ui.js'
import { TrafficChart } from './TrafficChart.js'
import { Audience } from './Audience.js'

function Leaderboard({ rows, kind, site, format }) {
  const { t } = useLanguage()
  return html`
    <article class="panel rank-board">
      <div class="rank-board-heading"><span class="eyebrow">TOP 100 / ${kind === 'counters' ? 'COUNTERS' : 'HOSTNAMES'}</span>
        <h2>${t(`rank.${kind}`)}</h2></div>
      <div class="rank-table-scroll">
        <table class="rank-table">
          <caption class="sr-only">${t(`rank.${kind}`)}</caption>
          <thead><tr><th scope="col"><span class="sr-only">${t('rank.position')}</span>#</th>
            <th scope="col">${t(kind === 'counters' ? 'rank.id' : 'rank.hostname')}</th>
            <th scope="col">${t('rank.total')}</th><th scope="col">24h</th><th scope="col">RPM</th></tr></thead>
          <tbody>${rows.length ? rows.map((row, index) => html`
            <tr key=${row.name}><td class=${index < 3 ? 'rank-position is-leading' : 'rank-position'}>${String(index + 1).padStart(2, '0')}</td>
              <th scope="row" class="rank-name" title=${row.name}>
                ${kind === 'sources' ? html`<a href=${`https://${row.name}/`} target="_blank" rel="noopener noreferrer">${row.name}</a>` : html`<a href=${`${site}/view/@${encodeURIComponent(row.name)}`}>${row.name}</a>`}
              </th><td>${format(row.total)}</td><td>${format(row.calls24h)}</td><td class="rank-rate">${format(row.rpm, 'rate')}</td></tr>
          `) : html`<tr><td colSpan="5" class="rank-empty">${t('rank.empty')}</td></tr>`}</tbody>
        </table>
      </div>
    </article>
  `
}

export function Rank({ site, themes }) {
  const { t, language } = useLanguage()
  const [sort, setSort] = useState('rpm')
  const [mode, setMode] = useState('minute:24h')
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState(null)
  const [chart, setChart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let busy = false
    let lastLoaded = 0
    const load = async () => {
      if (busy || document.hidden) return
      busy = true
      setLoading(true)
      const [granularity, range] = mode.split(':')
      try {
        const responses = await Promise.all([
          fetch(`${site}/api/rank?sort=${sort}`, { signal: controller.signal }),
          fetch(`${site}/api/stats/traffic?granularity=${granularity}&range=${range}`, { signal: controller.signal })
        ])
        if (responses.some(response => !response.ok)) throw new Error('Statistics unavailable')
        const [rank, traffic] = await Promise.all(responses.map(response => response.json()))
        if (controller.signal.aborted) return
        setData(rank)
        setChart(traffic)
        setFailed(false)
        lastLoaded = Date.now()
      } catch (error) {
        if (!controller.signal.aborted) setFailed(true)
      } finally {
        busy = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    const visible = () => { if (!document.hidden && Date.now() - lastLoaded >= 60000) load() }
    load()
    const timer = setInterval(load, 60000)
    document.addEventListener('visibilitychange', visible)
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', visible) }
  }, [site, sort, mode, refresh])

  const format = useNumberFormat(language)
  const time = value => new Intl.DateTimeFormat(language, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(value)
  const chartMatches = chart && `${chart.granularity}:${chart.end - chart.start > 86400000 ? '7d' : '24h'}` === mode

  return html`
    <div id="top"></div>
    <${SiteHeader} site=${site} page="rank" />
    <main id="main" class="rank-main">
      <section class="rank-intro">
        <div class="section-label"><span>${t('rank.kicker')}</span></div>
        <div class="rank-title-row"><h1>${t('rank.title')}</h1><a class="text-button" href=${`${site}/`}>${t('rank.home')}<${Icon} name="arrow-up-right" /></a></div>
        <p class="lede">${t('rank.intro')}</p>
        <div class="rank-status" aria-live="polite"><span class="status-dot"></span>${loading ? t('rank.loading') : data ? t('rank.updated', { time: time(data.updatedAt) }) : t('rank.refreshNote')}
          <button class="text-button" type="button" disabled=${loading} onClick=${() => setRefresh(value => value + 1)}><${Icon} name="refresh" />${t('rank.refresh')}</button></div>
        ${failed ? html`<p class="rank-error" role="alert">${t(data ? 'rank.stale' : 'rank.error')}</p>` : null}
        <div class="rank-summary" aria-busy=${loading}>
          <article class="panel rank-stat rank-stat--rpm"><span class="eyebrow">${t('rank.siteRpm')}</span><div class="rank-stat-value">${format(data?.site.rpm, 'rate')}<small>RPM</small></div><p>${t('rank.rpmNote')}</p></article>
          <article class="panel rank-stat"><span class="eyebrow">${t('rank.site24h')}</span><div class="rank-stat-value">${format(data?.site.calls24h)}</div><p>${t('rank.siteNote')}</p></article>
          <article class="panel rank-stat"><span class="eyebrow">${t('rank.unknown')}</span><div class="rank-stat-value">${format(data?.unknown.calls24h)}<small>24h</small></div><p>${t('rank.unknownNote', { total: format(data?.unknown.total), rpm: format(data?.unknown.rpm, 'rate') })}</p></article>
        </div>
        ${data && !data.rpmReady ? html`<p class="rank-coverage">${t('rank.warming')}</p>` : null}
      </section>
      <${Audience} countries=${data?.countries} languages=${data?.languages} format=${format} />
      <section id="traffic" class="panel rank-traffic">
        <div class="rank-panel-heading"><div><span class="eyebrow">${t('rank.chart.kicker')}</span><h2>${t('rank.chart.title')}</h2></div>
          <div class="rank-filters" role="group" aria-label=${t('rank.chart.range')}>
            ${['minute:24h', 'hour:24h', 'hour:7d'].map(value => html`<button key=${value} type="button" class=${mode === value ? 'is-active' : ''} aria-pressed=${mode === value} onClick=${() => setMode(value)}>${t(`rank.chart.${value.replace(':', '_')}`)}</button>`)}
          </div></div>
        <p class="rank-chart-unit">${t(mode.startsWith('minute') ? 'rank.chart.perMinute' : 'rank.chart.perHour')}</p>
        <${TrafficChart} data=${chartMatches ? chart : null} />
      </section>
      <section id="leaderboards" class="rank-leaderboards" aria-busy=${loading}>
        <div class="rank-panel-heading"><div><span class="eyebrow">${t('rank.topNote')}</span><h2>${t('rank.boards')}</h2></div>
          <div class="rank-filters" role="group" aria-label=${t('rank.sort')}>
            ${['rpm', '24h', 'total'].map(value => html`<button key=${value} type="button" class=${sort === value ? 'is-active' : ''} aria-pressed=${sort === value} onClick=${() => setSort(value)}>${t(`rank.sort_${value}`)}</button>`)}
          </div></div>
        <div class="rank-boards"><${Leaderboard} kind="counters" rows=${data?.counters || []} site=${site} format=${format} /><${Leaderboard} kind="sources" rows=${data?.sources || []} format=${format} /></div>
      </section>
    </main>
    <${SiteFooter} site=${site} themeCount=${themes.length} page="rank" rpm=${data?.site.rpm} />
    <${BackToTop} />
  `
}
