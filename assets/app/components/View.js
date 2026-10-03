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

export function View({ site, themes, name }) {
  const { t, language } = useLanguage()
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState(null)
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
      try {
        const response = await fetch(`${site}/api/stats/series/${encodeURIComponent(name)}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Statistics unavailable')
        const body = await response.json()
        if (controller.signal.aborted) return
        setData(body)
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
  }, [site, name, refresh])

  const format = useNumberFormat(language)
  const time = value => new Intl.DateTimeFormat(language, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(value)

  return html`
    <div id="top"></div>
    <${SiteHeader} site=${site} page="view" />
    <main id="main" class="view-main">
      <section class="view-intro">
        <div class="section-label"><span>${t('view.kicker')}</span></div>
        <div class="view-title-row">
          <h1>${name}</h1>
          <a class="text-button" href=${`${site}/rank`}>${t('view.rank')}<${Icon} name="arrow-up-right" /></a>
        </div>
        <p class="lede">${t('view.intro', { name })}</p>
        <div class="view-status" aria-live="polite"><span class="status-dot"></span>${loading ? t('view.loading') : data ? t('view.updated', { time: time(data.updatedAt) }) : t('view.refreshNote')}
          <button class="text-button" type="button" disabled=${loading} onClick=${() => setRefresh(value => value + 1)}><${Icon} name="refresh" />${t('view.refresh')}</button></div>
        ${failed ? html`<p class="view-error" role="alert">${t(data ? 'view.stale' : 'view.error')}</p>` : null}
      </section>

      <section class="view-summary" aria-busy=${loading}>
        <article class="panel view-stat view-stat--total">
          <span class="eyebrow">${t('view.total')}</span>
          <div class="view-stat-value">${format(data?.total)}</div>
          <p>${t('view.totalNote')}</p>
        </article>
        <article class="panel view-stat">
          <span class="eyebrow">${t('view.calls24h')}</span>
          <div class="view-stat-value">${format(data?.calls24h)}</div>
          <p>${t('view.callsNote')}</p>
        </article>
        <article class="panel view-stat">
          <span class="eyebrow">${t('view.rank24h')}</span>
          <div class="view-stat-value"><span>${format(data?.rank24h?.position)}</span><span class="view-rank-total">/ ${format(data?.rank24h?.total)}</span></div>
          <p>${t(data?.rank24h?.position === null ? 'view.unranked' : 'view.rank24hNote')}</p>
        </article>
      </section>

      <${Audience} countries=${data?.countries} languages=${data?.languages} format=${format} />

      <section class="panel view-traffic">
        <div class="view-panel-heading">
          <div><span class="eyebrow">${t('view.chart.kicker')}</span><h2>${t('view.chart.title')}</h2></div>
        </div>
        <p class="view-chart-unit">${t('view.chart.perMinute')}</p>
        <${TrafficChart} data=${data} labels=${{
          description: t('view.chart.description'),
          empty: t('view.chart.empty'),
          missing: t('view.chart.missing'),
          requests: (count) => t('view.chart.requests', { count })
        }} />
        ${data?.partial ? html`<p class="view-coverage">${t('view.warming')}</p>` : null}
      </section>
    </main>
    <${SiteFooter} site=${site} themeCount=${themes.length} page="view" />
    <${BackToTop} />
  `
}
