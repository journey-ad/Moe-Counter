import { useEffect, useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import { useLanguage } from '../lib/i18n.js'
import { Icon, PillButton } from './ui.js'

export function Hero({ site, themes, onSparkle, onTrack }) {
  const { t } = useLanguage()
  const themeCount = themes.length
  const [theme, setTheme] = useState(themes.find(({ name }) => name === 'capoo-2')?.name || themes[0]?.name || 'moebooru')
  const shuffle = () => {
    setTheme((current) => {
      const choices = themes.filter(({ name }) => name !== current)
      return choices.length ? choices[Math.floor(Math.random() * choices.length)].name : current
    })
  }
  useEffect(() => {
    if (themes.length < 2) return
    const timer = setInterval(() => { if (!document.hidden) shuffle() }, 5000)
    return () => clearInterval(timer)
  }, [themes])
  const showcase = `${site}/@demo?theme=${encodeURIComponent(theme)}&darkmode=0`

  return html`
    <section class="hero">
      <div class="hero-copy">
        <div class="hero-kicker"><span class="status-dot"></span>${t('hero.kicker')}</div>
        <h1 id="main_title">
          <span>${t('hero.line1')}</span>
          <span>${t('hero.line2')}<em>${t('hero.accent')}</em></span>
        </h1>
        <div class="hero-intro">
          <p>${t('hero.intro')}<br />${t('hero.detail', { count: themeCount })}</p>
        </div>
        <div class="hero-actions">
          <${PillButton} href="#tool" onClick=${() => onTrack('click', 'normal', 'go_config')}>
            ${t('hero.start')}<${Icon} name="arrow-up-right" />
          <//>
          <a class="hero-secondary" href="#themes">${t('hero.browse')}<${Icon} name="chevron-down" /></a>
        </div>
        <div class="hero-facts">
          <span><${Icon} name="heart" />${t('hero.facts.themes', { count: themeCount })}</span>
          <span>${t('hero.facts.svg')}</span><span>${t('hero.facts.openSource')}</span>
        </div>
      </div>

      <div class="hero-art">
        <span class="hero-art-note">${t('hero.note')}<span aria-hidden="true">↘</span></span>
        <div class="hero-poster">
          <div class="hero-poster-sheet">
            <div class="hero-poster-top">
              <span>${t('hero.preview.label')}</span>
              <b><span class="status-dot"></span>${t('hero.preview.status')}</b>
            </div>
            <div class="hero-poster-stage">
              <img key=${theme} src=${showcase} alt=${t('hero.preview.alt', { theme })} />
            </div>
            <div class="hero-poster-bottom">
              <span>${theme}</span>
              <button class="title-star" type="button" onClick=${onSparkle} aria-label=${t('hero.sparkle')}>
                <${Icon} name="star" />
              </button>
            </div>
          </div>
          <span class="hero-sticker" aria-hidden="true"><${Icon} name="heart" /><b>100%<br />MOE</b></span>
        </div>
        <div class="demo-picker">
          <button type="button" onClick=${shuffle} disabled=${themes.length < 2}>
            <${Icon} name="refresh" />${t('hero.shuffle')}
          </button>
        </div>
      </div>
    </section>
  `
}
