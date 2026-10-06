import type { PageProps, SeriesData } from '../types'
import { useCallback } from 'preact/hooks'
import { useNumberFormat } from '../hooks/ui'
import { useLanguage } from '../hooks/useLanguage'
import { usePolling } from '../hooks/usePolling'
import { PageLayout } from '../components/PageLayout'
import { Icon } from '../components/ui'
import { TrafficChart } from '../components/TrafficChart'
import { Audience } from '../components/Audience'

export function View({ site, themes, name }: PageProps) {
  const { t, language } = useLanguage()
  const loadStatistics = useCallback(
    async (signal: AbortSignal) => {
      const response = await fetch(`${site}/api/stats/series/${encodeURIComponent(name)}`, { signal })
      if (!response.ok) throw new Error('Statistics unavailable')
      return response.json() as Promise<SeriesData>
    },
    [site, name]
  )
  const { data, loading, failed, refresh } = usePolling(loadStatistics)

  const format = useNumberFormat(language)
  const time = (value: number) =>
    new Intl.DateTimeFormat(language, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
      value
    )

  return (
    <>
      <PageLayout site={site} themeCount={themes.length} page="view" mainClass="view-main">
        <section class="view-intro">
          <div class="section-label">
            <span>{t('view.kicker')}</span>
          </div>
          <div class="view-title-row">
            <h1>{name}</h1>
            <a class="text-button" href={`${site}/rank`}>
              {t('view.rank')}
              <Icon name="arrow-up-right" />
            </a>
          </div>
          <p class="lede">
            {t('view.intro', {
              name
            })}
          </p>
          <div class="view-status" aria-live="polite">
            <span class="status-dot" />
            {loading
              ? t('view.loading')
              : data
                ? t('view.updated', {
                    time: time(data.updatedAt)
                  })
                : t('view.refreshNote')}
            <button
              class="text-button"
              type="button"
              disabled={loading}
              onClick={refresh}
            >
              <Icon name="refresh" />
              {t('view.refresh')}
            </button>
          </div>
          {failed ? (
            <p class="view-error" role="alert">
              {t(data ? 'view.stale' : 'view.error')}
            </p>
          ) : null}
        </section>
        <section class="view-summary" aria-busy={loading}>
          <article class="panel view-stat view-stat--total">
            <span class="eyebrow">{t('view.total')}</span>
            <div class="view-stat-value">{format(data?.total)}</div>
            <p>{t('view.totalNote')}</p>
          </article>
          <article class="panel view-stat">
            <span class="eyebrow">{t('view.calls24h')}</span>
            <div class="view-stat-value">{format(data?.calls24h)}</div>
            <p>{t('view.callsNote')}</p>
          </article>
          <article class="panel view-stat">
            <span class="eyebrow">{t('view.rank24h')}</span>
            <div class="view-stat-value">
              <span>{format(data?.rank24h?.position)}</span>
              <span class="view-rank-total">/ {format(data?.rank24h?.total)}</span>
            </div>
            <p>{t(data?.rank24h?.position === null ? 'view.unranked' : 'view.rank24hNote')}</p>
          </article>
        </section>
        <Audience countries={data?.countries} languages={data?.languages} format={format} />
        <section class="panel view-traffic">
          <div class="view-panel-heading">
            <div>
              <span class="eyebrow">{t('view.chart.kicker')}</span>
              <h2>{t('view.chart.title')}</h2>
            </div>
          </div>
          <p class="view-chart-unit">{t('view.chart.perMinute')}</p>
          <TrafficChart
            data={data}
            labels={{
              description: t('view.chart.description'),
              empty: t('view.chart.empty'),
              missing: t('view.chart.missing'),
              requests: (count) =>
                t('view.chart.requests', {
                  count
                })
            }}
          />
          {data?.partial ? <p class="view-coverage">{t('view.warming')}</p> : null}
        </section>
      </PageLayout>
    </>
  )
}
