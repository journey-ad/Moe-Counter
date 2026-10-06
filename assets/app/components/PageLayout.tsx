import type { ComponentChildren } from 'preact'
import type { PageName, TrackEvent } from '../types'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import { BackToTop } from './BackToTop'

export function PageLayout({
  site,
  themeCount,
  page = 'home',
  mainClass,
  rpm,
  onTrack,
  banner,
  children
}: {
  site: string
  themeCount: number
  page?: PageName
  mainClass?: string
  rpm?: number | null
  onTrack?: TrackEvent
  banner?: ComponentChildren
  children?: ComponentChildren
}) {
  return (
    <>
      <div id="top" />
      <SiteHeader site={site} page={page} onTrack={onTrack} />
      <main id="main" class={mainClass}>
        {children}
      </main>
      <SiteFooter site={site} themeCount={themeCount} page={page} rpm={rpm} />
      {banner}
      <BackToTop />
    </>
  )
}
