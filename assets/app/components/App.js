import { useCallback, useRef, useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import { defaultConfig } from '../lib/counter.js'
import { useCopy, useToast } from '../lib/hooks.js'
import { scrollToSection } from '../lib/navigation.js'
import { SiteHeader } from './SiteHeader.js'
import { Hero } from './Hero.js'
import { Usage } from './Usage.js'
import { Configurator } from './Configurator.js'
import { ThemeGallery } from './ThemeGallery.js'
import { Credits } from './Credits.js'
import { SiteFooter } from './SiteFooter.js'
import { BackToTop } from './BackToTop.js'
import { Toast } from './Toast.js'
import { SponsorBanner } from './SponsorBanner.js'
import { useLanguage } from '../lib/i18n.js'

export function App({ site, themes, groups }) {
  const { t } = useLanguage()
  const [config, setConfig] = useState(defaultConfig)
  const [sponsorVisible, setSponsorVisible] = useState(() => {
    try { return sessionStorage.getItem('moe-counter-sponsor-dismissed') !== '1' } catch { return true }
  })
  const [copied, copy] = useCopy()
  const [toast, notify] = useToast()
  const sparkleLock = useRef(0)

  const themeNames = themes.map((theme) => theme.name)

  const dismissSponsor = () => {
    setSponsorVisible(false)
    try { sessionStorage.setItem('moe-counter-sponsor-dismissed', '1') } catch {}
  }

  // 事件名与分类沿用原有约定
  const track = useCallback((type, category, label) => {
    window._evt_push?.(type, category, label)
  }, [])

  const handleChange = useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = useCallback(() => {
    setConfig(defaultConfig)
    notify(t('toast.reset'))
  }, [notify, t])

  const handleUseTheme = useCallback(
    (name) => {
      setConfig((prev) => ({ ...prev, theme: name }))
      notify(t('toast.theme', { name }))
      track('click', 'theme', name)
      scrollToSection('tool')
    },
    [notify, track, t]
  )

  const handleCopy = useCallback(
    async (text, key) => {
      const ok = await copy(text, key)
      notify(t(ok ? 'toast.copied' : 'toast.copyError'))
    },
    [copy, notify, t]
  )

  const handleSparkle = useCallback((event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const now = Date.now()
    if (now < sparkleLock.current + 1000) return
    sparkleLock.current = now

    window.party?.sparkles(event.currentTarget, {
      count: window.party.variation.range(40, 100)
    })
  }, [])

  const handleCelebrate = useCallback(
    (element) => {
      track('click', 'normal', 'get_counter')
      notify(t('toast.generated'))

      if (window.party && element && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.party.confetti(element, { count: window.party.variation.range(20, 40) })
      }
    },
    [notify, track, t]
  )

  return html`
    <div id="top"></div>
    <${SiteHeader} site=${site} onTrack=${track} />
    <main id="main">
      <${Hero}
        site=${site}
        themes=${themes}
        onSparkle=${handleSparkle}
        onTrack=${track}
      />
      <${Usage} site=${site} copied=${copied} onCopy=${handleCopy} />
      <${Configurator}
        site=${site}
        config=${config}
        onChange=${handleChange}
        onReset=${handleReset}
        themeNames=${themeNames}
        copied=${copied}
        onCopy=${handleCopy}
        onCelebrate=${handleCelebrate}
      />
      <${ThemeGallery}
        site=${site}
        groups=${groups}
        themes=${themes}
        currentTheme=${config.theme}
        onUseTheme=${handleUseTheme}
      />
      <${Credits} showSponsor=${!sponsorVisible} onTrack=${track} />
    </main>
    <${SiteFooter} site=${site} themeCount=${themes.length} />
    <${SponsorBanner} visible=${sponsorVisible} onDismiss=${dismissSponsor} onTrack=${track} />
    <${BackToTop} />
    <${Toast} message=${toast.message} visible=${toast.visible} />
  `
}
