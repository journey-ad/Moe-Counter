import { useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import {
  alignOptions,
  buildEmbedUrl,
  buildPreviewUrl,
  darkmodeOptions,
  fieldGroups
} from '../lib/counter.js'
import { useDebounced } from '../lib/hooks.js'
import { CodeBlock, Icon, SectionHead } from './ui.js'
import { useLanguage } from '../lib/i18n.js'
import { Select } from './Select.js'

function sanitize(raw, field) {
  if (field.digitsOnly) return raw.replace(/[^0-9]/g, '')
  if (field.signed) return raw.replace(/[^0-9-]/g, '')
  if (field.decimal) return raw.replace(/[^0-9.]/g, '')
  return raw
}

function clamp(value, field) {
  const min = Number(field.min)
  const max = Number(field.max)
  const decimals = field.decimal ? 1 : 0

  if (value === '' || Number.isNaN(Number(value))) return ''

  const picked = Math.min(Math.max(Number(value), min), max)
  return picked.toFixed(decimals)
}

function step(value, field, direction) {
  const size = Number(field.step) || 1
  return clamp(String((Number(value) || 0) + size * direction), field)
}

function Field({ field, value, onChange, options, invalid, onEnter }) {
  const { t } = useLanguage()
  const emit = (event, next) => onChange(field.key, next ?? event.currentTarget.value)

  const control = () => {
    if (field.control === 'switch') {
      return html`
        <input
          id=${field.key}
          type="checkbox"
          role="switch"
          aria-describedby=${`${field.key}-hint`}
          checked=${value}
          onChange=${(event) => onChange(field.key, event.currentTarget.checked)}
        />
        <label class="switch" for=${field.key}><span></span></label>
      `
    }

    if (field.control === 'select') {
      return html`
        <${Select} id=${field.key} value=${value} options=${options}
          searchable=${field.key === 'theme'} wide=${field.key === 'theme'}
          onChange=${(next) => onChange(field.key, next)} />
      `
    }

    if (field.control === 'number') {
      return html`
        <div class="number-field">
          <button
            type="button"
            class="number-step"
            aria-label=${t('common.decrease', { field: t(`config.fields.${field.key}.label`) })}
            onClick=${() => onChange(field.key, step(value, field, -1))}
          >−</button>
          <input
            id=${field.key}
            type="text"
            inputMode=${field.decimal ? 'decimal' : 'numeric'}
            value=${value}
            placeholder=${field.placeholder}
            aria-invalid=${invalid ? 'true' : undefined}
            aria-describedby=${`${field.key}-hint`}
            onInput=${(event) => {
              const el = event.currentTarget
              const cleaned = sanitize(el.value, field)
              // Sync the sanitized value back to the DOM
              if (el.value !== cleaned) el.value = cleaned
              emit(event, cleaned)
            }}
            onBlur=${() => onChange(field.key, clamp(value, field))}
            onKeyDown=${(event) => onEnter?.(event)}
          />
          <button
            type="button"
            class="number-step"
            aria-label=${t('common.increase', { field: t(`config.fields.${field.key}.label`) })}
            onClick=${() => onChange(field.key, step(value, field, 1))}
          >+</button>
        </div>
      `
    }

    return html`
      <input
        id=${field.key}
        type="text"
        value=${value}
        maxLength=${field.maxLength}
        placeholder=${t('config.fields.name.placeholder')}
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        aria-invalid=${invalid ? 'true' : undefined}
        aria-describedby=${invalid ? 'name-error name-hint' : 'name-hint'}
        onInput=${(event) => emit(event)}
        onKeyDown=${(event) => onEnter?.(event)}
      />
    `
  }

  return html`
    <div class="tool-field ${invalid ? 'is-invalid' : ''}">
      <div class="tool-field-copy">
        <label id=${`${field.key}-label`} for=${field.key}>${t(`config.fields.${field.key}.label`)}<code aria-hidden="true">${field.key}</code></label>
        <p id=${`${field.key}-hint`}>${t(`config.fields.${field.key}.hint`)}</p>
      </div>
      <div class="tool-field-input">
        ${control()}
        ${invalid ? html`<p id="name-error" class="tool-field-error" role="alert">${t('config.fields.name.error')}</p>` : null}
      </div>
    </div>
  `
}

export function Configurator({ site, config, onChange, onReset, themeNames, copied, onCopy, onCelebrate }) {
  const { t } = useLanguage()
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState(false)
  const [previewRevision, setPreviewRevision] = useState(0)

  const debouncedPreviewUrl = useDebounced(buildPreviewUrl(site, config))
  const previewUrl = config.theme === 'random' && previewRevision > 0
    ? `${debouncedPreviewUrl}&refresh=${previewRevision}`
    : debouncedPreviewUrl
  const embedUrl = buildEmbedUrl(site, config)
  const hasName = config.name.trim().length > 0

  const optionsFor = (field) => {
    if (field.key === 'theme') {
      return [
        { value: 'random', label: t('config.options.random') },
        // The demo counter is not stored, so previews never touch a real count
        ...themeNames.map((name) => ({ value: name, label: name, preview: `${site}/@demo?theme=${encodeURIComponent(name)}&darkmode=0` }))
      ]
    }
    if (field.key === 'align') {
      return alignOptions.map((value) => ({ value, label: t(`config.options.align.${value}`) }))
    }
    if (field.key === 'darkmode') return darkmodeOptions.map(({ value }) => ({ value, label: t(`config.options.darkmode.${value}`) }))
    return []
  }

  const handleGenerate = (event) => {
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

  const handleNameKeyDown = (event) => {
    if (event.key === 'Enter') handleGenerate(event)
  }

  return html`
    <section id="tool" class="section">
      <${SectionHead}
        index="02"
        title=${t('config.title')}
        note=${t('config.note')}
      />

      <p class="lede">
        ${t('config.intro')}
      </p>

      <div class="tool-layout">
        <div class="tool-fields">
          ${fieldGroups.map(
            (group) => html`
              <div class="tool-group" key=${group.id}>
                <h3 class="tool-group-title">${t(`config.sections.${group.id}.title`)}</h3>
                ${group.id === 'advanced' ? html`<p class="tool-group-note">${t('config.sections.advanced.description')}</p>` : null}
                ${group.fields.map(
                  (field) => html`
                    <${Field}
                      key=${field.key}
                      field=${field}
                      value=${config[field.key]}
                      options=${optionsFor(field)}
                      invalid=${field.key === 'name' ? error : ''}
                      onChange=${(key, value) => {
                        if (key === 'name') setError(false)
                        onChange(key, value)
                      }}
                      onEnter=${field.key === 'name' ? handleNameKeyDown : undefined}
                    />
                  `
                )}
              </div>
            `
          )}
        </div>

        <aside class="tool-preview">
          <div class="preview-card">
            <div class="preview-head">
              <span><span class="status-dot"></span>${t('config.preview.title')}</span>
              <button class="text-button" type="button" onClick=${() => {
                setRevealed(false)
                setError(false)
                onReset()
              }}>
                <${Icon} name="refresh" /><span>${t('config.reset')}</span>
              </button>
            </div>

            <div class="preview-stage">
              ${hasName
                ? html`<img id="result" src=${previewUrl} alt=${t('config.preview.alt')} />`
                : html`<div class="preview-empty"><${Icon} name="heart" /><p>${t('config.preview.empty')}</p></div>`}
            </div>
            <p class="preview-safe"><${Icon} name="check" />${t('config.preview.safe')}</p>

            <div class="preview-actions">
              <button id="get" class="pill-button" type="button" onClick=${handleGenerate}>
                <span>${t('config.generate')}</span>
                <${Icon} name="arrow-up-right" />
              </button>
            </div>

            ${revealed && hasName
              ? html`
                  <div class="preview-out">
                    <span class="preview-out-label">
                      <${Icon} name="check" />
                      <span>${t('config.embed')}</span>
                    </span>
                    <${CodeBlock}
                      code=${embedUrl}
                      codeId="code"
                      copied=${copied}
                      copyKey="embed"
                      onCopy=${onCopy}
                    />
                  </div>
                `
              : null}
          </div>
        </aside>
      </div>
    </section>
  `
}
