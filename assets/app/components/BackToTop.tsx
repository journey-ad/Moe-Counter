import type { JSX } from 'preact'
import { useState } from 'preact/hooks'
import { useLanguage } from '../hooks/useLanguage'
import { useScrolled } from '../hooks/ui'
import { scrollToSection } from '../lib/navigation'

export function BackToTop() {
  const { t } = useLanguage()
  const visible = useScrolled(1000)
  const [leaving, setLeaving] = useState(false)

  const handleClick = () => {
    if (leaving) return
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setLeaving(true)
    scrollToSection('top')
  }

  const handleAnimationEnd = (event: JSX.TargetedAnimationEvent<HTMLButtonElement>) => {
    if (event.animationName === 'back-to-top-poof') setLeaving(false)
  }

  return (
    <button
      class={'back-to-top ' + (visible || leaving ? 'is-visible' : '') + ' ' + (leaving ? 'is-leaving' : '')}
      type="button"
      aria-label={t('nav.top')}
      tabIndex={visible && !leaving ? 0 : -1}
      disabled={leaving}
      onClick={handleClick}
      onAnimationEnd={handleAnimationEnd}
    />
  )
}
