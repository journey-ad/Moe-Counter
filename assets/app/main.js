import { render } from 'preact'
import { html } from './lib/html.js'
import { readGlobalData } from './lib/counter.js'
import { App } from './components/App.js'
import { LanguageProvider, loadInitialLanguage } from './lib/i18n.js'
import { installAnchorNavigation } from './lib/navigation.js'

const { site, themes, groups } = readGlobalData()
const root = document.getElementById('app')

if (root) {
  installAnchorNavigation()
  const initialLocale = await loadInitialLanguage()
  render(html`<${LanguageProvider} initialLocale=${initialLocale} themeCount=${themes.length}><${App} site=${site} themes=${themes} groups=${groups} /><//>`, root)
}
