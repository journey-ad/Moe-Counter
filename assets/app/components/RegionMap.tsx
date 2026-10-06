import type VectorMap from 'jsvectormap'
import type { BreakdownRow, NumberFormatter } from '../types'
import { useEffect, useRef, useState } from 'preact/hooks'
import { useLanguage } from '../hooks/useLanguage'

const COLORS = {
  1: 'color-mix(in srgb, var(--pink) 20%, var(--surface-soft))',
  2: 'color-mix(in srgb, var(--pink) 40%, var(--surface-soft))',
  3: 'color-mix(in srgb, var(--pink) 60%, var(--surface-soft))',
  4: 'color-mix(in srgb, var(--pink) 80%, var(--surface-soft))',
  5: 'var(--pink)'
}

export function RegionMap({ rows, format }: { rows: BreakdownRow[]; format: NumberFormatter }) {
  const { t, language } = useLanguage()
  const container = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    const host = container.current
    if (!host) return
    let disposed = false
    let instance: VectorMap | undefined
    let resize: ResizeObserver | undefined
    setStatus('loading')

    const load = async () => {
      try {
        const { default: VectorMap } = await import('jsvectormap')
        window.jsVectorMap = VectorMap
        await import('jsvectormap/dist/maps/world.js')
        if (disposed) return

        const names = new Intl.DisplayNames(language, { type: 'region' })
        const byCode = new Map(rows.map((row) => [row.name.toUpperCase(), row]))
        const cn = byCode.get('CN')
        const tw = byCode.get('TW')
        if (cn || tw) {
          const merged = { name: 'cn', total: (cn?.total || 0) + (tw?.total || 0) }
          byCode.set('CN', merged)
          byCode.set('TW', merged)
        }
        const maximum = Math.max(0, ...Array.from(byCode.values(), (row) => row.total))
        const values = Object.fromEntries(
          [...byCode]
            .filter(([, row]) => row.total > 0)
            .map(([code, row]) => [code, Math.ceil((row.total / maximum) * 5)])
        )

        instance = new VectorMap({
          selector: host,
          map: 'world',
          draggable: false,
          zoomButtons: false,
          zoomOnScroll: false,
          bindTouchEvents: false,
          regionStyle: {
            initial: { fill: 'var(--surface-soft)', stroke: 'var(--surface)', strokeWidth: 0.7 },
            hover: { fillOpacity: 0.8 }
          },
          series: {
            regions: [{ attribute: 'fill', scale: COLORS, values }]
          },
          onRegionTooltipShow: (event, tooltip, code) => {
            const row = byCode.get(code)
            const detail = row ? `${t('rank.total')}: ${format(row.total)}` : t('rank.geo.noRegionData')
            tooltip.getElement().classList.add('rank-map-tooltip')
            tooltip.text(`${names.of(code === 'TW' ? 'CN' : code)} · ${detail}`)
          }
        })
        resize = new ResizeObserver(() => instance?.updateSize())
        resize.observe(host)
        setStatus('ready')
      } catch (error) {
        if (!disposed) {
          console.error('Could not load region map:', error)
          setStatus('failed')
        }
      }
    }
    load()

    return () => {
      disposed = true
      resize?.disconnect()
      instance?.destroy()
      host.replaceChildren()
    }
  }, [rows, language, format, t])

  const message =
    status === 'loading'
      ? t('rank.geo.mapLoading')
      : status === 'failed'
        ? t('rank.geo.mapError')
        : !rows.length
          ? t('rank.geo.emptyGeo')
          : ''

  return (
    <article class="panel rank-board rank-region-map">
      <div class="rank-board-heading">
        <span class="eyebrow">{t('rank.geo.kicker')}</span>
        <h2>{t('rank.geo.title')}</h2>
      </div>
      <div class="rank-map">
        <div ref={container} class="rank-map-canvas" role="img" aria-label={t('rank.geo.mapDescription')} />
        {message ? (
          <p class="rank-map-message" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </article>
  )
}
