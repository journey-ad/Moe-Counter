import { html } from '../lib/html.js'
import { useLanguage } from '../lib/i18n.js'
import { useInView } from '../lib/hooks.js'

export function Icon({ name, className = '' }) {
  return html`<span class="ui-icon ui-icon--${name} ${className}" aria-hidden="true"></span>`
}

/* 进入视口后上浮显现，用在版块标题上 */
export function Reveal({ className = '', children }) {
  const [ref, inView] = useInView()

  return html`
    <div ref=${ref} class="reveal ${inView ? 'is-revealed' : ''} ${className}">${children}</div>
  `
}

export function PillButton({ href, onClick, variant, size, type, disabled, children }) {
  const className = [
    'pill-button',
    variant ? `pill-button--${variant}` : '',
    size ? `pill-button--${size}` : ''
  ]
    .filter(Boolean)
    .join(' ')

  if (!href) {
    return html`
      <button
        class=${className}
        type=${type || 'button'}
        disabled=${disabled}
        onClick=${onClick}
      >
        ${children}
      </button>
    `
  }

  return html`
    <a class=${className} href=${href} onClick=${onClick}>${children}</a>
  `
}

export function Tag({ children, tone }) {
  return html`<span class="tag ${tone ? `tag--${tone}` : ''}">${children}</span>`
}

export function SectionHead({ index, title, note }) {
  return html`
    <div class="section-head">
      <div class="section-label"><span>${index} / ${note}</span></div>
      <${Reveal} className="section-heading"><h2>${title}</h2><//>
    </div>
  `
}

export function CodeBlock({ code, label, copied, onCopy, copyKey = 'block', codeId }) {
  const { t } = useLanguage()
  return html`
    <div class="code-block">
      ${label ? html`<span class="code-label">${label}</span>` : null}
      <div class="code-row">
        <pre><code id=${codeId}>${code}</code></pre>
        <button
          class="copy-button ${copied === copyKey ? 'is-copied' : ''}"
          type="button"
          aria-label=${t('common.copyLabel')}
          onClick=${() => onCopy(code, copyKey)}
        >
          <${Icon} name=${copied === copyKey ? 'check' : 'copy'} />
          <span>${t(copied === copyKey ? 'common.copied' : 'common.copy')}</span>
        <//>
      </div>
    </div>
  `
}
