import { render } from 'preact'
import { html } from './lib/html.js'
import { readGlobalData } from './lib/counter.js'
import { LanguageProvider, loadInitialLanguage } from './lib/i18n.js'
import { installAnchorNavigation, scrollToSection } from './lib/navigation.js'

const { site, page, themes, groups } = readGlobalData()
const root = document.getElementById('app')

if (root) {
  installAnchorNavigation()
  const initialLocale = await loadInitialLanguage()
  const Page = page === 'rank' ? (await import('./components/Rank.js')).Rank : (await import('./components/App.js')).App
  render(html`<${LanguageProvider} initialLocale=${initialLocale} themeCount=${themes.length} page=${page}><${Page} site=${site} themes=${themes} groups=${groups} /><//>`, root)

  // Sections only exist after the first render, so a hash carried over from another page has to be handled here
  const initialSection = location.hash.slice(1)
  if (initialSection) requestAnimationFrame(() => scrollToSection(initialSection))
}
