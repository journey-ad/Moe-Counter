import { useCallback, useEffect, useState } from 'preact/hooks'

const POLL_INTERVAL = 60000

export function usePolling<Data>(loadData: (signal: AbortSignal) => Promise<Data>) {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision((current) => current + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    let busy = false
    let lastLoaded = 0
    const load = async () => {
      if (busy || document.hidden) return
      busy = true
      setLoading(true)
      try {
        const result = await loadData(controller.signal)
        if (controller.signal.aborted) return
        setData(result)
        setFailed(false)
        lastLoaded = Date.now()
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      } finally {
        busy = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    const visible = () => {
      if (!document.hidden && Date.now() - lastLoaded >= POLL_INTERVAL) load()
    }
    load()
    const timer = setInterval(load, POLL_INTERVAL)
    document.addEventListener('visibilitychange', visible)
    return () => {
      controller.abort()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [loadData, revision])

  return { data, loading, failed, refresh }
}
