import { render } from 'preact'
import { html } from './lib/html.js'
import { readGlobalData } from './lib/counter.js'
import { LanguageProvider, loadInitialLanguage } from './lib/i18n.js'
import { installAnchorNavigation, scrollToSection } from './lib/navigation.js'

const { site, page, themes, groups, name } = readGlobalData()
const root = document.getElementById('app')

const PAGES = {
  home: () => import('./components/App.js').then(module => module.App),
  rank: () => import('./components/Rank.js').then(module => module.Rank),
  view: () => import('./components/View.js').then(module => module.View)
}

if (root) {
  installAnchorNavigation()
  const initialLocale = await loadInitialLanguage()
  const Page = await (PAGES[page] || PAGES.home)()
  render(html`<${LanguageProvider} initialLocale=${initialLocale} themeCount=${themes.length} page=${page} name=${name}><${Page} site=${site} themes=${themes} groups=${groups} name=${name} /><//>`, root)

  // Sections only exist after the first render, so a hash carried over from another page has to be handled here
  const initialSection = location.hash.slice(1)
  if (initialSection) requestAnimationFrame(() => scrollToSection(initialSection))
}
