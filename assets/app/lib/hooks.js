import { useEffect, useRef, useState } from 'preact/hooks'

/* One shared observer for every theme preview; no image is requested before the element enters the viewport */
const inViewCallbacks = new WeakMap()
let inViewObserver = null

function getInViewObserver() {
  if (!inViewObserver) {
    inViewObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const callback = inViewCallbacks.get(entry.target)
          inViewCallbacks.delete(entry.target)
          inViewObserver.unobserve(entry.target)
          callback?.()
        })
      },
      { rootMargin: '240px' }
    )
  }

  return inViewObserver
}

export function useInView() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return

    inViewCallbacks.set(el, () => setInView(true))
    getInViewObserver().observe(el)

    return () => {
      inViewCallbacks.delete(el)
      getInViewObserver().unobserve(el)
    }
  }, [inView])

  return [ref, inView]
}

export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })

    return () => window.removeEventListener('scroll', update)
  }, [threshold])

  return scrolled
}

/* A band in the middle of the viewport decides which section counts as current */
export function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const targets = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (targets.length < 2) return

    const inView = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) inView.set(entry.target, entry.boundingClientRect.top)
          else inView.delete(entry.target)
        })
        if (!inView.size) return

        // When several sections enter at once, take the topmost one
        const topmost = [...inView.entries()].sort((a, b) => a[1] - b[1])[0][0]
        setActive(topmost.id)
      },
      { rootMargin: '-45% 0px -45% 0px' }
    )

    targets.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [ids.join(',')])

  return active
}

export function useDebounced(value, delay = 320) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/* Self-hosted instances usually run over plain http, where the clipboard API is unavailable, so fall back to selection copy */
async function writeClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '-1000px'
  document.body.appendChild(area)
  area.select()

  const ok = document.execCommand('copy')
  document.body.removeChild(area)

  if (!ok) throw new Error('copy failed')
}

export function useCopy() {
  const [copiedKey, setCopiedKey] = useState(null)
  const timer = useRef(0)

  const copy = async (text, key) => {
    try {
      await writeClipboard(text)
      setCopiedKey(key)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopiedKey(null), 1600)
      return true
    } catch {
      return false
    }
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  return [copiedKey, copy]
}

/* Toast for copy and theme apply, dismissed after 1.8s */
export function useToast() {
  const [toast, setToast] = useState({ message: '', visible: false })
  const timer = useRef(0)

  const notify = (text) => {
    setToast({ message: text, visible: true })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast((current) => ({ ...current, visible: false })), 1800)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  return [toast, notify]
}
