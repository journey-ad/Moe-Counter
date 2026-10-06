import type { JSX } from 'preact'
import type { ChangeConfig, CopyCode, PageProps, TrackEvent } from '../types'
import { useCallback, useRef, useState } from 'preact/hooks'
import { useCopy, useToast } from '../hooks/ui'
import { useLanguage } from '../hooks/useLanguage'
import { defaultConfig } from '../lib/counter'
import { scrollToSection } from '../lib/navigation'
import { PageLayout } from '../components/PageLayout'
import { Hero } from '../components/Hero'
import { Usage } from '../components/Usage'
import { Configurator } from '../components/Configurator'
import { ThemeGallery } from '../components/ThemeGallery'
import { Credits } from '../components/Credits'
import { Toast } from '../components/Toast'
import { SponsorBanner } from '../components/SponsorBanner'

export function Home({ site, themes, groups }: PageProps) {
  const { t } = useLanguage()
  const [config, setConfig] = useState(defaultConfig)
  const [copied, copy] = useCopy()
  const [toast, notify] = useToast()

  const track = useCallback<TrackEvent>((type, category, label) => {
    window._evt_push?.(type, category, label)
  }, [])

  const handleChange = useCallback<ChangeConfig>((key, value) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }, [])

  const handleReset = useCallback(() => {
    setConfig(defaultConfig)
    notify(t('toast.reset'))
  }, [notify, t])

  const handleUseTheme = useCallback(
    (name: string) => {
      setConfig((current) => ({ ...current, theme: name }))
      notify(t('toast.theme', { name }))
      track('click', 'theme', name)
      scrollToSection('tool')
    },
    [notify, track, t]
  )

  const handleCopy = useCallback<CopyCode>(
    async (text, key) => {
      const ok = await copy(text, key)
      notify(t(ok ? 'toast.copied' : 'toast.copyError'))
    },
    [copy, notify, t]
  )

  const handleCelebrate = useCallback(
    (element: HTMLElement) => {
      track('click', 'normal', 'get_counter')
      notify(t('toast.generated'))

      if (window.party && element && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.party.confetti(element, { count: window.party.variation.range(20, 40) })
      }
    },
    [notify, track, t]
  )

  const [sponsorVisible, setSponsorVisible] = useState(() => {
    try {
      return sessionStorage.getItem('moe-counter-sponsor-dismissed') !== '1'
    } catch {
      return true
    }
  })
  const sparkleLock = useRef(0)

  const themeNames = themes.map((theme) => theme.name)

  const dismissSponsor = () => {
    setSponsorVisible(false)
    try {
      sessionStorage.setItem('moe-counter-sponsor-dismissed', '1')
    } catch {}
  }

  const handleSparkle = useCallback((event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const now = Date.now()
    if (now < sparkleLock.current + 1000) return
    sparkleLock.current = now

    window.party?.sparkles(event.currentTarget, {
      count: window.party.variation.range(40, 100)
    })
  }, [])

  return (
    <>
      <PageLayout
        site={site}
        themeCount={themes.length}
        onTrack={track}
        banner={<SponsorBanner visible={sponsorVisible} onDismiss={dismissSponsor} onTrack={track} />}
      >
        <Hero site={site} themes={themes} onSparkle={handleSparkle} onTrack={track} />
        <Usage site={site} copied={copied} onCopy={handleCopy} />
        <Configurator
          site={site}
          config={config}
          onChange={handleChange}
          onReset={handleReset}
          themeNames={themeNames}
          copied={copied}
          onCopy={handleCopy}
          onCelebrate={handleCelebrate}
        />
        <ThemeGallery
          site={site}
          groups={groups}
          themes={themes}
          currentTheme={config.theme}
          onUseTheme={handleUseTheme}
        />
        <Credits showSponsor={!sponsorVisible} onTrack={track} />
      </PageLayout>
      <Toast message={toast.message} visible={toast.visible} />
    </>
  )
}
