import type { JSX } from 'preact'
import type { RankRow, NumberFormatter, PageProps, RankData, TrafficData } from '../types'
import { useCallback, useState } from 'preact/hooks'
import { useNumberFormat } from '../hooks/ui'
import { useLanguage } from '../hooks/useLanguage'
import { usePolling } from '../hooks/usePolling'
import { PageLayout } from '../components/PageLayout'
import { Icon } from '../components/ui'
import { TrafficChart } from '../components/TrafficChart'
import { Audience } from '../components/Audience'
import { SourceVisitDialog } from '../components/SourceVisitDialog'

function Leaderboard({
  rows,
  kind,
  site,
  format,
  onVisitSource
}: {
  rows: RankRow[]
  kind: 'counters' | 'sources'
  site?: string
  format: NumberFormatter
  onVisitSource?: (hostname: string) => void
}) {
  const { t } = useLanguage()
  const visitSource = (event: JSX.TargetedMouseEvent<HTMLButtonElement>, hostname: string) => {
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    onVisitSource?.(hostname)
  }

  return (
    <article class="panel rank-board">
      <div class="rank-board-heading">
        <span class="eyebrow">TOP 100 / {kind === 'counters' ? 'COUNTERS' : 'HOSTNAMES'}</span>
        <h2>{t(`rank.${kind}`)}</h2>
      </div>
      <div class="rank-table-scroll">
        <table class="rank-table">
          <caption class="sr-only">{t(`rank.${kind}`)}</caption>
          <thead>
            <tr>
              <th scope="col">
                <span class="sr-only">{t('rank.position')}</span>#
              </th>
              <th scope="col">{t(kind === 'counters' ? 'rank.id' : 'rank.hostname')}</th>
              <th scope="col">{t('rank.total')}</th>
              <th scope="col">24h</th>
              <th scope="col">RPM</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={row.name}>
                  <td class={index < 3 ? 'rank-position is-leading' : 'rank-position'}>
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <th scope="row" class="rank-name" title={row.name}>
                    {kind === 'sources' ? (
                      <button
                        class="rank-source"
                        type="button"
                        aria-haspopup="dialog"
                        onClick={(event) => visitSource(event, row.name)}
                        onAuxClick={(event) => {
                          if (event.button === 1) visitSource(event, row.name)
                        }}
                        onContextMenu={(event) => visitSource(event, row.name)}
                      >
                        {row.name}
                      </button>
                    ) : (
                      <a href={`${site}/view/@${encodeURIComponent(row.name).replace(/%3A/g, ':')}`}>{row.name}</a>
                    )}
                  </th>
                  <td>{format(row.total)}</td>
                  <td>{format(row.calls24h)}</td>
                  <td class="rank-rate">{format(row.rpm, 'rate')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} class="rank-empty">
                  {t('rank.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export function Rank({ site, themes }: PageProps) {
  const { t, language } = useLanguage()
  const [sort, setSort] = useState('rpm')
  const [mode, setMode] = useState('minute:24h')
  const [source, setSource] = useState<string | null>(null)

  const loadStatistics = useCallback(
    async (signal: AbortSignal) => {
      const [granularity, range] = mode.split(':')
      const responses = await Promise.all([
        fetch(`${site}/api/rank?sort=${sort}`, { signal }),
        fetch(`${site}/api/stats/traffic?granularity=${granularity}&range=${range}`, { signal })
      ])
      if (responses.some((response) => !response.ok)) throw new Error('Statistics unavailable')
      const [rank, traffic] = await Promise.all([
        responses[0].json() as Promise<RankData>,
        responses[1].json() as Promise<TrafficData>
      ])
      return { rank, traffic }
    },
    [site, sort, mode]
  )
  const { data: statistics, loading, failed, refresh } = usePolling(loadStatistics)
  const data = statistics?.rank ?? null
  const chart = statistics?.traffic ?? null

  const format = useNumberFormat(language)
  const time = (value: number) =>
    new Intl.DateTimeFormat(language, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
      value
    )
  const chartMatches = chart && `${chart.granularity}:${chart.end - chart.start > 86400000 ? '7d' : '24h'}` === mode

  return (
    <>
      <PageLayout site={site} themeCount={themes.length} page="rank" mainClass="rank-main" rpm={data?.site.rpm}>
        <section class="rank-intro">
          <div class="section-label">
            <span>{t('rank.kicker')}</span>
          </div>
          <div class="rank-title-row">
            <h1>{t('rank.title')}</h1>
            <a class="text-button" href={`${site}/`}>
              {t('rank.home')}
              <Icon name="arrow-up-right" />
            </a>
          </div>
          <p class="lede">{t('rank.intro')}</p>
          <div class="rank-status" aria-live="polite">
            <span class="status-dot" />
            {loading
              ? t('rank.loading')
              : data
                ? t('rank.updated', {
                    time: time(data.updatedAt)
                  })
                : t('rank.refreshNote')}
            <button
              class="text-button"
              type="button"
              disabled={loading}
              onClick={refresh}
            >
              <Icon name="refresh" />
              {t('rank.refresh')}
            </button>
          </div>
          {failed ? (
            <p class="rank-error" role="alert">
              {t(data ? 'rank.stale' : 'rank.error')}
            </p>
          ) : null}
          <div class="rank-summary" aria-busy={loading}>
            <article class="panel rank-stat rank-stat--rpm">
              <span class="eyebrow">{t('rank.siteRpm')}</span>
              <div class="rank-stat-value">
                {format(data?.site.rpm, 'rate')}
                <small>RPM</small>
              </div>
              <p>{t('rank.rpmNote')}</p>
            </article>
            <article class="panel rank-stat">
              <span class="eyebrow">{t('rank.site24h')}</span>
              <div class="rank-stat-value">{format(data?.site.calls24h)}</div>
              <p>{t('rank.siteNote')}</p>
            </article>
            <article class="panel rank-stat">
              <span class="eyebrow">{t('rank.unknown')}</span>
              <div class="rank-stat-value">
                {format(data?.unknown.calls24h)}
                <small>24h</small>
              </div>
              <p>
                {t('rank.unknownNote', {
                  total: format(data?.unknown.total),
                  rpm: format(data?.unknown.rpm, 'rate')
                })}
              </p>
            </article>
          </div>
          {data && !data.rpmReady ? <p class="rank-coverage">{t('rank.warming')}</p> : null}
        </section>
        <Audience countries={data?.countries} languages={data?.languages} format={format} />
        <section id="traffic" class="panel rank-traffic">
          <div class="rank-panel-heading">
            <div>
              <span class="eyebrow">{t('rank.chart.kicker')}</span>
              <h2>{t('rank.chart.title')}</h2>
            </div>
            <div class="rank-filters" role="group" aria-label={t('rank.chart.range')}>
              {['minute:24h', 'hour:24h', 'hour:7d'].map((value) => (
                <button
                  key={value}
                  type="button"
                  class={mode === value ? 'is-active' : ''}
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  {t(`rank.chart.${value.replace(':', '_')}`)}
                </button>
              ))}
            </div>
          </div>
          <p class="rank-chart-unit">{t(mode.startsWith('minute') ? 'rank.chart.perMinute' : 'rank.chart.perHour')}</p>
          <TrafficChart data={chartMatches ? chart : null} />
        </section>
        <section id="leaderboards" class="rank-leaderboards" aria-busy={loading}>
          <div class="rank-panel-heading">
            <div>
              <span class="eyebrow">{t('rank.topNote')}</span>
              <h2>{t('rank.boards')}</h2>
            </div>
            <div class="rank-filters" role="group" aria-label={t('rank.sort')}>
              {['rpm', '24h', 'total'].map((value) => (
                <button
                  key={value}
                  type="button"
                  class={sort === value ? 'is-active' : ''}
                  aria-pressed={sort === value}
                  onClick={() => setSort(value)}
                >
                  {t(`rank.sort_${value}`)}
                </button>
              ))}
            </div>
          </div>
          <div class="rank-boards">
            <Leaderboard kind="counters" rows={data?.counters || []} site={site} format={format} />
            <Leaderboard kind="sources" rows={data?.sources || []} format={format} onVisitSource={setSource} />
          </div>
        </section>
      </PageLayout>
      {source ? <SourceVisitDialog hostname={source} onClose={() => setSource(null)} /> : null}
    </>
  )
}
