import { html } from '../lib/html.js'
import { useLanguage } from '../lib/i18n.js'
import { buildUsageSnippets } from '../lib/counter.js'
import { CodeBlock, Icon, SectionHead } from './ui.js'

export function Usage({ site, copied, onCopy }) {
  const { t } = useLanguage()
  const snippets = buildUsageSnippets(site)

  return html`
    <section id="usage" class="section">
      <${SectionHead}
        index="01"
        title=${t('usage.title')}
        note=${t('usage.note')}
      />

      <p class="lede">
        ${t('usage.intro')}
      </p>

      <ul class="usage-grid">
        ${snippets.map(
          (item) => html`
            <li key=${item.step}>
              <article class="panel usage-card">
                <span class="usage-step">${item.step}</span>
                <div class="usage-copy"><h3>${t(`usage.methods.${item.id}.title`)}</h3><p>${t(`usage.methods.${item.id}.description`)}</p></div>
                <${CodeBlock}
                  code=${item.code}
                  copied=${copied}
                  copyKey=${`usage-${item.step}`}
                  onCopy=${onCopy}
                />
              </article>
            </li>
          `
        )}
      </ul>

      <aside class="panel note-panel">
        <span class="note-mark" aria-hidden="true"><${Icon} name="exclamation" /></span>
        <div>
          <b>${t('usage.name.title')}</b>
          <p>
            ${t('usage.name.description')}
          </p>
        </div>
      </aside>
    </section>
  `
}
