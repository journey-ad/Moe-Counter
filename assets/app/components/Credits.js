import { html } from '../lib/html.js'
import { Icon, PillButton, SectionHead, Tag } from './ui.js'
import { useLanguage } from '../lib/i18n.js'

const CREDITS = [
  { label: 'A-SOUL_Official', href: 'https://space.bilibili.com/703007996' },
  { label: 'moebooru', href: 'https://github.com/moebooru/moebooru', nofollow: true },
  { label: 'gelbooru.com', note: 'NSFW' },
  { label: 'Icons8', href: 'https://icons8.com/icon/80355/star', nofollow: true },
  {
    label: 'contributors',
    href: 'https://github.com/journey-ad/Moe-Counter/issues/new?assignees=&labels=theme&projects=&template=contribute-theme.yml&title=%5BTheme%5D%3A+'
  }
]

export function Credits({ showSponsor, onTrack }) {
  const { t } = useLanguage()
  return html`
    <section id="credits" class="section">
      <${SectionHead} index="04" title=${t('credits.title')} note=${t('credits.note')} />

      <ul class="credit-list">
        ${CREDITS.map(
          (item) => html`
            <li key=${item.label} class=${item.label === 'contributors' ? 'credit-contributors' : ''}>
              ${item.href
                ? html`
                    <a
                      href=${item.href}
                      target="_blank"
                      rel=${item.nofollow ? 'nofollow noopener' : 'noopener'}
                    >
                      <span>${item.label === 'contributors' ? t('credits.contributors') : item.label}</span>
                      <${Icon} name="arrow-up-right" />
                    </a>
                  `
                : html`
                    <span class="credit-plain">
                      <span>${item.label}</span>
                      ${item.note ? html`<${Tag} tone="nsfw">${item.note}<//>` : null}
                    </span>
                  `}
            </li>
          `
        )}
      </ul>

      ${showSponsor ? html`<aside class="sponsor-card">
        <div class="sponsor-copy">
          <span class="eyebrow">${t('sponsor.eyebrow')}</span>
          <h3>${t('sponsor.title')}</h3>
          <p>
            ${t('sponsor.description')}
          </p>
        </div>
        <div class="sponsor-links">
          <${PillButton}
            href="https://ko-fi.com/journey_ad"
            onClick=${() => onTrack('click', 'normal', 'go_kofi')}
          >
            Ko-fi<${Icon} name="arrow-up-right" />
          <//>
          <${PillButton}
            href="https://ifdian.net/a/journey_ad"
            variant="ghost"
            onClick=${() => onTrack('click', 'normal', 'go_afdian')}
          >
            ${t('sponsor.afdian')}<${Icon} name="arrow-up-right" />
          <//>
        </div>
      </aside>` : null}
    </section>
  `
}
