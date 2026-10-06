import { useLayoutEffect, useRef } from 'preact/hooks'
import { html } from '../lib/html.js'
import { useLanguage } from '../lib/i18n.js'
import { Icon } from './ui.js'

export function SourceVisitDialog({ hostname, onClose }) {
  const { t } = useLanguage()
  const dialog = useRef(null)
  const cancel = useRef(null)
  const url = new URL(`https://${hostname}/`).href

  useLayoutEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    element.showModal()
    cancel.current.focus({ preventScroll: true })
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  const leave = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return html`
    <dialog ref=${dialog} class="source-visit-dialog" aria-labelledby="source-visit-title" aria-describedby="source-visit-intro"
      onCancel=${event => { event.preventDefault(); onClose() }}
      onClick=${event => { if (event.target === event.currentTarget) onClose() }}>
      <div class="source-visit-content">
        <div class="source-visit-heading">
          <span class="source-visit-mark" aria-hidden="true">!</span>
          <div><span class="eyebrow">${t('rank.external.kicker')}</span><h2 id="source-visit-title">${t('rank.external.title')}</h2></div>
        </div>
        <p id="source-visit-intro" class="source-visit-intro">${t('rank.external.intro')}</p>
        <div class="source-visit-destination">
          <span>${t('rank.external.destination')}</span><strong>${hostname}</strong><code>${url}</code>
        </div>
        <ul class="source-visit-notices">
          <li><h3>${t('rank.external.listingTitle')}</h3><p>${t('rank.external.listing')}</p></li>
          <li><h3>${t('rank.external.riskTitle')}</h3><p>${t('rank.external.risk')}</p></li>
        </ul>
        <p class="source-visit-disclaimer">${t('rank.external.disclaimer')}</p>
      </div>
      <div class="source-visit-actions">
        <button ref=${cancel} class="pill-button pill-button--ghost pill-button--small" type="button" onClick=${onClose}>${t('rank.external.cancel')}</button>
        <button class="pill-button pill-button--small" type="button" onClick=${leave}>${t('rank.external.continue')}<${Icon} name="arrow-up-right" /></button>
      </div>
    </dialog>
  `
}
