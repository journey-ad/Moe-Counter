import type { CopyCode } from '../types'
import { useLanguage } from '../hooks/useLanguage'
import { buildUsageSnippets } from '../lib/counter'
import { CodeBlock, Icon, SectionHead } from './ui'

export function Usage({ site, copied, onCopy }: { site: string; copied: string | null; onCopy: CopyCode }) {
  const { t } = useLanguage()
  const snippets = buildUsageSnippets(site)

  return (
    <section id="usage" class="section">
      <SectionHead index="01" title={t('usage.title')} note={t('usage.note')} />
      <p class="lede">{t('usage.intro')}</p>
      <ul class="usage-grid">
        {snippets.map((item) => (
          <li key={item.step}>
            <article class="panel usage-card">
              <span class="usage-step">{item.step}</span>
              <div class="usage-copy">
                <h3>{t(`usage.methods.${item.id}.title`)}</h3>
                <p>{t(`usage.methods.${item.id}.description`)}</p>
              </div>
              <CodeBlock code={item.code} copied={copied} copyKey={`usage-${item.step}`} onCopy={onCopy} />
            </article>
          </li>
        ))}
      </ul>
      <aside class="panel note-panel">
        <span class="note-mark" aria-hidden="true">
          <Icon name="exclamation" />
        </span>
        <div>
          <b>{t('usage.name.title')}</b>
          <p>{t('usage.name.description')}</p>
        </div>
      </aside>
    </section>
  )
}
