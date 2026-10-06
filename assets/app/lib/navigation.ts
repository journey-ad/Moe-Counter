export function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return null
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
  return target
}

export function installAnchorNavigation() {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return
    const id = link.getAttribute('href')?.slice(1) || ''
    if (!document.getElementById(id)) return

    event.preventDefault()
    const target = scrollToSection(id)
    if (!target) return
    if (event.detail === 0) {
      const temporaryTabIndex = !target.hasAttribute('tabindex')
      if (temporaryTabIndex) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
      if (temporaryTabIndex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
    }
  })
}
