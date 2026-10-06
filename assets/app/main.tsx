import 'vite/modulepreload-polyfill'
import '../style.css'
import party from 'party-js'
import { render } from 'preact'
import { I18nextProvider } from 'react-i18next'
import type { ComponentType } from 'preact'
import type { GlobalData, PageName, PageProps } from './types'
import { i18n, i18nReady } from './lib/i18n'
import { PageMetadata } from './components/PageMetadata'
import { installAnchorNavigation, scrollToSection } from './lib/navigation'

function readGlobalData(): GlobalData {
  const node = document.getElementById('global-data')
  const fallback: GlobalData = { site: '', page: 'home', name: '', groups: [], themes: [] }

  try {
    return { ...fallback, ...JSON.parse(node?.textContent || '{}') }
  } catch {
    return fallback
  }
}

const { site, page, themes, groups, name } = readGlobalData()
const root = document.getElementById('app')
window.party = party

const PAGES: Record<PageName, () => Promise<ComponentType<PageProps>>> = {
  home: () => import('./pages/Home').then((module) => module.Home),
  rank: () => import('./pages/Rank').then((module) => module.Rank),
  view: () => import('./pages/View').then((module) => module.View)
}

if (root) {
  installAnchorNavigation()
  const [, Page] = await Promise.all([i18nReady, (PAGES[page] || PAGES.home)()])
  render(
    <I18nextProvider i18n={i18n}>
      <PageMetadata themeCount={themes.length} page={page} name={name} />
      <Page site={site} themes={themes} groups={groups} name={name} />
    </I18nextProvider>,
    root
  )

  // Sections only exist after the first render, so a hash carried over from another page has to be handled here
  const initialSection = location.hash.slice(1)
  if (initialSection) requestAnimationFrame(() => scrollToSection(initialSection))
}
