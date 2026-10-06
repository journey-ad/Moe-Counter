import type { JSX, ComponentChildren } from 'preact'
import type { CopyCode } from '../types'
import { useLanguage } from '../hooks/useLanguage'
import { useInView } from '../hooks/ui'

export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span class={'ui-icon ui-icon--' + name + ' ' + className} aria-hidden="true" />
}

/* Fades up once in view, used on section headings */
export function Reveal({ className = '', children }: { className?: string; children?: ComponentChildren }) {
  const [ref, inView] = useInView()

  return (
    <div ref={ref} class={'reveal ' + (inView ? 'is-revealed' : '') + ' ' + className}>
      {children}
    </div>
  )
}

export function PillButton({
  href,
  onClick,
  variant,
  size,
  type,
  disabled,
  children
}: {
  href?: string
  onClick?: JSX.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
  variant?: string
  size?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  children?: ComponentChildren
}) {
  const className = ['pill-button', variant ? `pill-button--${variant}` : '', size ? `pill-button--${size}` : '']
    .filter(Boolean)
    .join(' ')

  if (!href) {
    return (
      <button class={className} type={type || 'button'} disabled={disabled} onClick={onClick}>
        {children}
      </button>
    )
  }

  return (
    <a class={className} href={href} onClick={onClick}>
      {children}
    </a>
  )
}

export function Tag({ children, tone }: { children?: ComponentChildren; tone?: string }) {
  return <span class={'tag ' + (tone ? `tag--${tone}` : '')}>{children}</span>
}

export function SectionHead({ index, title, note }: { index: string; title: string; note: string }) {
  return (
    <div class="section-head">
      <div class="section-label">
        <span>
          {index} / {note}
        </span>
      </div>
      <Reveal className="section-heading">
        <h2>{title}</h2>
      </Reveal>
    </div>
  )
}

export function CodeBlock({
  code,
  label,
  copied,
  onCopy,
  copyKey = 'block',
  codeId
}: {
  code: string
  label?: string
  copied: string | null
  onCopy: CopyCode
  copyKey?: string
  codeId?: string
}) {
  const { t } = useLanguage()
  return (
    <div class="code-block">
      {label ? <span class="code-label">{label}</span> : null}
      <div class="code-row">
        <pre>
          <code id={codeId}>{code}</code>
        </pre>
        <button
          class={'copy-button ' + (copied === copyKey ? 'is-copied' : '')}
          type="button"
          aria-label={t('common.copyLabel')}
          onClick={() => onCopy(code, copyKey)}
        >
          <Icon name={copied === copyKey ? 'check' : 'copy'} />
          <span>{t(copied === copyKey ? 'common.copied' : 'common.copy')}</span>
        </button>
      </div>
    </div>
  )
}
