import { useEffect, useRef, useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import { useLanguage } from '../lib/i18n.js'

export function TrafficChart({ data }) {
  const { t, language } = useLanguage()
  const ref = useRef(null)
  const [width, setWidth] = useState(960)
  const [active, setActive] = useState(null)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => setActive(null), [data])

  const points = data?.points || []
  const maximum = Math.max(1, ...points.map(point => point.count || 0))
  const magnitude = Math.max(1, 10 ** Math.floor(Math.log10(maximum / 4)))
  const ceiling = Math.ceil(maximum / magnitude / 4) * magnitude * 4
  const left = 45, right = width - 12, top = 18, bottom = 254
  const x = (index) => left + index / Math.max(1, points.length - 1) * (right - left)
  const y = (count) => bottom - count / ceiling * (bottom - top)
  const segments = []
  let segment = []
  for (const [index, point] of points.entries()) {
    if (point.count === null) {
      if (segment.length) segments.push(segment)
      segment = []
    } else segment.push([x(index), y(point.count)])
  }
  if (segment.length) segments.push(segment)
  const line = segments.map(part => part.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(2)},${py.toFixed(2)}`).join(' ')).join(' ')
  const area = segments.map(part => `M${part[0][0]},${bottom} ${part.map(([px, py]) => `L${px.toFixed(2)},${py.toFixed(2)}`).join(' ')} L${part.at(-1)[0]},${bottom} Z`).join(' ')
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 1, notation: 'compact' })
  const date = (time, full = false) => new Intl.DateTimeFormat(language, {
    ...(full || data?.end - data?.start > 86400000 ? { month: 'numeric', day: 'numeric' } : {}),
    ...(full || data?.end - data?.start <= 86400000 ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(time)
  const point = active === null ? null : points[active]
  const ticks = width < 450 ? 3 : 5
  const select = (event) => {
    if (!points.length) return
    const rect = ref.current.getBoundingClientRect()
    setActive(Math.max(0, Math.min(points.length - 1, Math.round((event.clientX - rect.left - left) / (right - left) * (points.length - 1)))))
  }

  return html`
    <div class="traffic-plot">
      <svg ref=${ref} viewBox=${`0 0 ${width} 300`} role="img" tabIndex="0"
        aria-label=${t('rank.chart.description')} onPointerMove=${select} onPointerDown=${select}
        onPointerLeave=${() => setActive(null)} onBlur=${() => setActive(null)}
        onKeyDown=${event => {
          if (!points.length || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          setActive(event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : Math.max(0, Math.min(points.length - 1, (active ?? points.length - 1) + (event.key === 'ArrowRight' ? 1 : -1))))
        }}>
        <title>${t('rank.chart.description')}</title>
        ${Array.from({ length: 5 }, (_, i) => html`
          <g key=${i}><line class="traffic-grid" x1=${left} x2=${right} y1=${y(ceiling * i / 4)} y2=${y(ceiling * i / 4)} />
            <text class="traffic-label" x=${left - 10} y=${y(ceiling * i / 4) + 4} text-anchor="end">${number.format(ceiling * i / 4)}</text></g>
        `)}
        <path class="traffic-area" d=${area} />
        <path class="traffic-line" d=${line} />
        ${segments.filter(part => part.length === 1).map(([coordinate]) => html`<circle class="traffic-dot" cx=${coordinate[0]} cy=${coordinate[1]} r="3" />`)}
        ${points.length ? Array.from({ length: ticks }, (_, i) => {
          const index = Math.round(i / (ticks - 1) * (points.length - 1))
          return html`<text key=${i} class="traffic-label" x=${x(index)} y="283" text-anchor=${i === 0 ? 'start' : i === ticks - 1 ? 'end' : 'middle'}>${date(points[index].time)}</text>`
        }) : null}
        ${point ? html`<line class="traffic-cursor" x1=${x(active)} x2=${x(active)} y1=${top} y2=${bottom} />
          ${point.count !== null ? html`<circle class="traffic-dot" cx=${x(active)} cy=${y(point.count)} r="4" />` : null}` : null}
      </svg>
      ${!segments.length ? html`<p class="traffic-no-data">${t('rank.chart.empty')}</p>` : null}
      ${point ? html`<div class="traffic-tooltip" role="status"><span>${date(point.time, true)}</span>
        <b>${point.count === null ? t('rank.chart.missing') : t('rank.chart.requests', { count: new Intl.NumberFormat(language).format(point.count) })}</b></div>` : null}
    </div>
  `
}
