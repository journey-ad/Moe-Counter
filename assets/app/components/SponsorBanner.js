import { useEffect, useRef } from 'preact/hooks'
import { html } from '../lib/html.js'
import { useLanguage } from '../lib/i18n.js'
import { Icon } from './ui.js'

export function SponsorBanner({ visible, onDismiss, onTrack }) {
  const { t } = useLanguage()
  const ref = useRef(null)

  useEffect(() => {
    if (!visible) return
    const update = () => {
      if (ref.current) document.documentElement.style.setProperty('--sponsor-space', `${ref.current.offsetHeight}px`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--sponsor-space')
    }
  }, [visible])

  if (!visible) return null

  return html`
    <aside ref=${ref} class="sponsor-banner" aria-label=${t('sponsor.eyebrow')}>
      <div class="sponsor-banner-inner">
        <span class="sponsor-banner-mark" aria-hidden="true"><${Icon} name="heart" /></span>
        <div class="sponsor-banner-copy"><span class="eyebrow">${t('sponsor.eyebrow')}</span><b>${t('sponsor.title')}</b><p>${t('sponsor.description')}</p></div>
        <div class="sponsor-banner-links">
          <a href="https://ko-fi.com/journey_ad" target="_blank" rel="noopener" onClick=${() => onTrack('click', 'normal', 'go_kofi')}>Ko-fi<${Icon} name="arrow-up-right" /></a>
          <a href="https://ifdian.net/a/journey-ad" target="_blank" rel="noopener" onClick=${() => onTrack('click', 'normal', 'go_afdian')}>${t('sponsor.afdian')}<${Icon} name="arrow-up-right" /></a>
        </div>
        <button class="sponsor-banner-close" type="button" aria-label=${t('sponsor.close')} onClick=${onDismiss}><${Icon} name="close" /></button>
      </div>
    </aside>
  `
}
