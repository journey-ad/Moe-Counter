import { useEffect, useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import { useLanguage } from '../lib/i18n.js'
import { Icon, PillButton } from './ui.js'

const NOTE_COUNT = 5
const NOTE_INTERVAL = 5000
// Delay between two characters being typed or erased
const CHAR_STEP = 40
// The gap between a note being erased and the next one being typed
const NOTE_PAUSE = 150

const pickTheme = (themes, exclude) => {
  const choices = themes.filter(({ name }) => name !== exclude)
  return choices.length ? choices[Math.floor(Math.random() * choices.length)].name : themes[0]?.name || 'moebooru'
}

export function Hero({ site, themes, onSparkle, onTrack }) {
  const { t } = useLanguage()
  const themeCount = themes.length
  const [theme, setTheme] = useState(() => themes.find(({ name }) => name === 'moebooru')?.name || pickTheme(themes))
  const [cycle, setCycle] = useState(0)
  const shuffle = () => {
    setTheme((current) => pickTheme(themes, current))
    setCycle((count) => count + 1)
  }
  useEffect(() => {
    if (themes.length < 2) return
    const timer = setTimeout(() => { if (!document.hidden) shuffle() }, 10000)
    return () => clearTimeout(timer)
  }, [themes, cycle])
  const [note, setNote] = useState(() => Math.floor(Math.random() * NOTE_COUNT))
  const [phase, setPhase] = useState('idle')
  const text = t(`hero.notes.${note}`)
  const [typed, setTyped] = useState(text.length)
  useEffect(() => {
    if (phase === 'idle') {
      const timer = setTimeout(() => { if (!document.hidden) setPhase('erasing') }, NOTE_INTERVAL)
      return () => clearTimeout(timer)
    }
    if (phase === 'erasing') {
      if (!typed) {
        const timer = setTimeout(() => {
          setNote((current) => (current + 1 + Math.floor(Math.random() * (NOTE_COUNT - 1))) % NOTE_COUNT)
          setPhase('typing')
        }, NOTE_PAUSE)
        return () => clearTimeout(timer)
      }
      const timer = setTimeout(() => setTyped((count) => count - 1), CHAR_STEP)
      return () => clearTimeout(timer)
    }
    if (typed >= text.length) {
      setPhase('idle')
      return
    }
    const timer = setTimeout(() => setTyped((count) => count + 1), CHAR_STEP)
    return () => clearTimeout(timer)
  }, [phase, typed, text.length])
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
        <span class="hero-art-note">
          <span class="hero-note-text">${text.slice(0, typed)}</span>
          <span class="hero-art-note-arrow" aria-hidden="true">↘</span>
        </span>
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
