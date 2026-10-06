declare module 'jsvectormap' {
  interface MapOptions {
    selector: HTMLElement
    map: string
    draggable: boolean
    zoomButtons: boolean
    zoomOnScroll: boolean
    bindTouchEvents: boolean
    regionStyle: {
      initial: { fill: string; stroke: string; strokeWidth: number }
      hover: { fillOpacity: number }
    }
    series: {
      regions: { attribute: string; scale: Record<number, string>; values: Record<string, number> }[]
    }
    onRegionTooltipShow: (event: Event, tooltip: { getElement(): HTMLElement; text(value: string): void }, code: string) => void
  }

  export default class VectorMap {
    constructor(options: MapOptions)
    updateSize(): void
    destroy(): void
  }
}

declare module 'jsvectormap/dist/maps/world.js'
