import { useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import { useLanguage } from '../lib/i18n.js'
import { useScrolled } from '../lib/hooks.js'
import { scrollToSection } from '../lib/navigation.js'

export function BackToTop() {
  const { t } = useLanguage()
  const visible = useScrolled(1000)
  const [leaving, setLeaving] = useState(false)

  const handleClick = () => {
    if (leaving) return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setLeaving(true)
    scrollToSection('top')
  }

  const handleAnimationEnd = (event) => {
    if (event.animationName === 'back-to-top-poof') setLeaving(false)
  }

  return html`
    <button
      class="back-to-top ${visible || leaving ? 'is-visible' : ''} ${leaving ? 'is-leaving' : ''}"
      type="button"
      aria-label=${t('nav.top')}
      tabIndex=${visible && !leaving ? 0 : -1}
      disabled=${leaving}
      onClick=${handleClick}
      onAnimationEnd=${handleAnimationEnd}
    ></button>
  `
}
