import type { JSX } from 'preact'
import type { FieldDefinition, ChangeConfig, SelectOption, StringConfigKey, CounterConfig, CopyCode } from '../types'
import { useState } from 'preact/hooks'
import { alignOptions, buildEmbedUrl, buildPreviewUrl, darkmodeOptions, fieldGroups } from '../lib/counter'
import { useDebounced } from '../hooks/ui'
import { CodeBlock, Icon, SectionHead } from './ui'
import { useLanguage } from '../hooks/useLanguage'
import { Select } from './Select'

function sanitize(raw: string, field: FieldDefinition) {
  if (field.digitsOnly) return raw.replace(/[^0-9]/g, '')
  if (field.signed) return raw.replace(/[^0-9-]/g, '')
  if (field.decimal) return raw.replace(/[^0-9.]/g, '')
  return raw
}

function clamp(value: string, field: FieldDefinition) {
  const min = Number(field.min)
  const max = Number(field.max)
  const decimals = field.decimal ? 1 : 0

  if (value === '' || Number.isNaN(Number(value))) return ''

  const picked = Math.min(Math.max(Number(value), min), max)
  return picked.toFixed(decimals)
}

function step(value: string, field: FieldDefinition, direction: number) {
  const size = Number(field.step) || 1
  return clamp(String((Number(value) || 0) + size * direction), field)
}

function Field({
  field,
  value,
  onChange,
  options,
  invalid,
  onEnter
}: {
  field: FieldDefinition
  value: string | boolean
  onChange: ChangeConfig
  options: SelectOption[]
  invalid?: boolean
  onEnter?: JSX.KeyboardEventHandler<HTMLInputElement>
}) {
  const { t } = useLanguage()
  const emit = (event: JSX.TargetedEvent<HTMLInputElement>, next?: string) =>
    onChange(field.key as StringConfigKey, next ?? event.currentTarget.value)

  const control = () => {
    if (field.control === 'switch') {
      return (
        <>
          <input
            id={field.key}
            type="checkbox"
            role="switch"
            aria-describedby={`${field.key}-hint`}
            checked={value === true}
            onChange={(event) => onChange(field.key, event.currentTarget.checked)}
          />
          <label class="switch" for={field.key}>
            <span />
          </label>
        </>
      )
    }

    if (field.control === 'select') {
      return (
        <Select
          id={field.key}
          value={String(value)}
          options={options}
          searchable={field.key === 'theme'}
          wide={field.key === 'theme'}
          onChange={(next) => onChange(field.key, next)}
        />
      )
    }

    if (field.control === 'number') {
      return (
        <div class="number-field">
          <button
            type="button"
            class="number-step"
            aria-label={t('common.decrease', {
              field: t(`config.fields.${field.key}.label`)
            })}
            onClick={() => onChange(field.key, step(String(value), field, -1))}
          >
            −
          </button>
          <input
            id={field.key}
            type="text"
            inputMode={field.decimal ? 'decimal' : 'numeric'}
            value={String(value)}
            placeholder={field.placeholder}
            aria-invalid={invalid ? 'true' : undefined}
            aria-describedby={`${field.key}-hint`}
            onInput={(event) => {
              const el = event.currentTarget
              const cleaned = sanitize(el.value, field)
              // Sync the sanitized value back to the DOM
              if (el.value !== cleaned) el.value = cleaned
              emit(event, cleaned)
            }}
            onBlur={() => onChange(field.key, clamp(String(value), field))}
            onKeyDown={(event) => onEnter?.(event)}
          />
          <button
            type="button"
            class="number-step"
            aria-label={t('common.increase', {
              field: t(`config.fields.${field.key}.label`)
            })}
            onClick={() => onChange(field.key, step(String(value), field, 1))}
          >
            +
          </button>
        </div>
      )
    }

    return (
      <input
        id={field.key}
        type="text"
        value={String(value)}
        maxLength={field.maxLength}
        placeholder={t('config.fields.name.placeholder')}
        autocomplete="off"
        autocapitalize="off"
        spellcheck={false}
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={invalid ? 'name-error name-hint' : 'name-hint'}
        onInput={(event) => emit(event)}
        onKeyDown={(event) => onEnter?.(event)}
      />
    )
  }

  return (
    <div class={'tool-field ' + (invalid ? 'is-invalid' : '')}>
      <div class="tool-field-copy">
        <label id={`${field.key}-label`} for={field.key}>
          {t(`config.fields.${field.key}.label`)}
          <code aria-hidden="true">{field.key}</code>
        </label>
        <p id={`${field.key}-hint`}>{t(`config.fields.${field.key}.hint`)}</p>
      </div>
      <div class="tool-field-input">
        {control()}
        {invalid ? (
          <p id="name-error" class="tool-field-error" role="alert">
            {t('config.fields.name.error')}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function Configurator({
  site,
  config,
  onChange,
  onReset,
  themeNames,
  copied,
  onCopy,
  onCelebrate
}: {
  site: string
  config: CounterConfig
  onChange: ChangeConfig
  onReset: () => void
  themeNames: string[]
  copied: string | null
  onCopy: CopyCode
  onCelebrate: (element: HTMLElement) => void
}) {
  const { t } = useLanguage()
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState(false)
  const [previewRevision, setPreviewRevision] = useState(0)

  const debouncedPreviewUrl = useDebounced(buildPreviewUrl(site, config))
  const previewUrl =
    config.theme === 'random' && previewRevision > 0
      ? `${debouncedPreviewUrl}&refresh=${previewRevision}`
      : debouncedPreviewUrl
  const embedUrl = buildEmbedUrl(site, config)
  const hasName = config.name.trim().length > 0

  const optionsFor = (field: FieldDefinition) => {
    if (field.key === 'theme') {
      return [
        { value: 'random', label: t('config.options.random') },
        // The demo counter is not stored, so previews never touch a real count
        ...themeNames.map((name) => ({
          value: name,
          label: name,
          preview: `${site}/@demo?theme=${encodeURIComponent(name)}&darkmode=0`
        }))
      ]
    }
    if (field.key === 'align') {
      return alignOptions.map((value) => ({ value, label: t(`config.options.align.${value}`) }))
    }
    if (field.key === 'darkmode')
      return darkmodeOptions.map(({ value }) => ({ value, label: t(`config.options.darkmode.${value}`) }))
    return []
  }

  const handleGenerate = (event: JSX.TargetedEvent<HTMLElement>) => {
    if (!hasName) {
      setError(true)
      document.getElementById('name')?.focus()
      return
    }

    setError(false)
    setRevealed(true)
    if (config.theme === 'random') setPreviewRevision((revision) => revision + 1)
    onCelebrate(event.currentTarget)
  }

  const handleNameKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleGenerate(event)
  }

  return (
    <section id="tool" class="section">
      <SectionHead index="02" title={t('config.title')} note={t('config.note')} />
      <p class="lede">{t('config.intro')}</p>
      <div class="tool-layout">
        <div class="tool-fields">
          {fieldGroups.map((group) => (
            <div class="tool-group" key={group.id}>
              <h3 class="tool-group-title">{t(`config.sections.${group.id}.title`)}</h3>
              {group.id === 'advanced' ? (
                <p class="tool-group-note">{t('config.sections.advanced.description')}</p>
              ) : null}
              {group.fields.map((field) => (
                <Field
                  key={field.key}
                  field={field}
                  value={config[field.key]}
                  options={optionsFor(field)}
                  invalid={field.key === 'name' ? error : false}
                  onChange={(key, value) => {
                    if (key === 'name') setError(false)
                    onChange(key, value)
                  }}
                  onEnter={field.key === 'name' ? handleNameKeyDown : undefined}
                />
              ))}
            </div>
          ))}
        </div>
        <aside class="tool-preview">
          <div class="preview-card">
            <div class="preview-head">
              <span>
                <span class="status-dot" />
                {t('config.preview.title')}
              </span>
              <button
                class="text-button"
                type="button"
                onClick={() => {
                  setRevealed(false)
                  setError(false)
                  onReset()
                }}
              >
                <Icon name="refresh" />
                <span>{t('config.reset')}</span>
              </button>
            </div>
            <div class="preview-stage">
              {hasName ? (
                <img id="result" src={previewUrl} alt={t('config.preview.alt')} />
              ) : (
                <div class="preview-empty">
                  <Icon name="heart" />
                  <p>{t('config.preview.empty')}</p>
                </div>
              )}
            </div>
            <p class="preview-safe">
              <Icon name="check" />
              {t('config.preview.safe')}
            </p>
            <div class="preview-actions">
              <button id="get" class="pill-button" type="button" onClick={handleGenerate}>
                <span>{t('config.generate')}</span>
                <Icon name="arrow-up-right" />
              </button>
            </div>
            {revealed && hasName ? (
              <div class="preview-out">
                <span class="preview-out-label">
                  <Icon name="check" />
                  <span>{t('config.embed')}</span>
                </span>
                <CodeBlock code={embedUrl} codeId="code" copied={copied} copyKey="embed" onCopy={onCopy} />
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  )
}
