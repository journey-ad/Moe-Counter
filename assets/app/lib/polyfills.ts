import ResizeObserverPolyfill from 'resize-observer-polyfill'

if (!window.ResizeObserver) window.ResizeObserver = ResizeObserverPolyfill

/* Browsers without IntersectionObserver report every observed target as visible */
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    constructor(private callback: IntersectionObserverCallback) {}

    observe(target: Element) {
      const entry = { target, isIntersecting: true, boundingClientRect: target.getBoundingClientRect() }
      this.callback([entry as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }

    unobserve() {}

    disconnect() {}
  } as unknown as typeof IntersectionObserver
}

/* Safari 12.0 and Chrome below 73 have no Object.fromEntries */
if (!Object.fromEntries) {
  Object.fromEntries = (entries: Iterable<readonly [PropertyKey, unknown]>) => {
    const result: Record<PropertyKey, unknown> = {}
    for (const [key, value] of entries) result[key] = value
    return result
  }
}
