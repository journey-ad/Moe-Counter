import { useEffect, useState } from 'preact/hooks'

export function useAppearance() {
  const [preference, setPreference] = useState(() => document.documentElement.dataset.appearance)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const appearance = preference || (systemDark ? 'dark' : 'light')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', appearance === 'dark' ? '#1c2420' : '#faf8f5')
  }, [appearance])

  const toggleAppearance = () => {
    const next = appearance === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.appearance = next
    setPreference(next)
    try { localStorage.setItem('moe-counter-appearance', next) } catch {}
  }

  return { appearance, toggleAppearance }
}
