import { useEffect, useRef, useState } from 'preact/hooks'
import { html } from '../lib/html.js'
import { useLanguage } from '../lib/i18n.js'
import { Icon } from './ui.js'

export function Select({ id, value, options, onChange, searchable = false }) {
  const { t } = useLanguage()
  const root = useRef(null)
  const trigger = useRef(null)
  const search = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [placement, setPlacement] = useState('bottom')
  const [height, setHeight] = useState(320)
  const selected = options.find((option) => option.value === value)
  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
  const listId = `${id}-options`
  const activeId = filtered[active] ? `${id}-option-${active}` : undefined

  const close = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) trigger.current?.focus()
  }

  const show = () => {
    const rect = trigger.current.getBoundingClientRect()
    const header = document.querySelector('.site-header')?.offsetHeight || 0
    const banner = document.querySelector('.sponsor-banner')?.offsetHeight || 0
    const below = window.innerHeight - rect.bottom - banner - 12
    const above = rect.top - header - 12
    const upwards = below < 260 && above > below
    setPlacement(upwards ? 'top' : 'bottom')
    setHeight(Math.max(100, Math.min(320, upwards ? above : below)))
    setQuery('')
    setActive(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }

  const choose = (option) => {
    if (!option) return
    onChange(option.value)
    close(true)
  }

  useEffect(() => {
    if (!open) return
    if (searchable) search.current?.focus()
    const outside = (event) => { if (!root.current?.contains(event.target)) close() }
    const resize = () => close(true)
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', resize)
    return () => {
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('resize', resize)
    }
  }, [open])

  useEffect(() => {
    if (open) root.current?.querySelector(`[id="${activeId}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, query])

  const handleKey = (event) => {
    const { key } = event
    if (key === 'Escape' && open) {
      event.preventDefault()
      close(true)
    } else if (key === 'Tab' && open) {
      trigger.current?.focus()
      close()
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault()
      if (!open) show()
      else setActive((index) => Math.max(0, Math.min(filtered.length - 1, index + (key === 'ArrowDown' ? 1 : -1))))
    } else if (open && (key === 'Home' || key === 'End') && event.target !== search.current) {
      event.preventDefault()
      setActive(key === 'Home' ? 0 : filtered.length - 1)
    } else if (open && (key === 'Enter' || (key === ' ' && event.target !== search.current))) {
      event.preventDefault()
      choose(filtered[active])
    }
  }

  return html`
    <div ref=${root} class="custom-select ${open ? 'is-open' : ''}" onKeyDown=${handleKey}
      onBlur=${(event) => { if (!event.currentTarget.contains(event.relatedTarget)) close() }}>
      <button ref=${trigger} id=${id} type="button" class="select-trigger" role="combobox"
        aria-expanded=${open} aria-haspopup="listbox" aria-controls=${listId}
        aria-labelledby=${`${id}-label ${id}-value`} aria-describedby=${`${id}-hint`}
        aria-activedescendant=${open && !searchable ? activeId : undefined}
        onClick=${() => open ? close() : show()}>
        <span id=${`${id}-value`}>${selected?.label || value}</span><${Icon} name="chevron-down" />
      </button>
      ${open ? html`
        <div class="select-popup select-popup--${placement}" style=${`--select-max-height: ${height}px`}>
          ${searchable ? html`
            <div class="select-search"><${Icon} name="search" />
              <input ref=${search} type="text" role="combobox" aria-expanded="true" aria-autocomplete="list"
                aria-controls=${listId} aria-activedescendant=${activeId} aria-label=${t('themes.search.label')}
                placeholder=${t('themes.search.placeholder')} value=${query} autocomplete="off"
                onInput=${(event) => { setQuery(event.currentTarget.value); setActive(0) }} />
            </div>
          ` : null}
          <div id=${listId} class="select-options" role="listbox" aria-labelledby=${`${id}-label`}>
            ${filtered.map((option, index) => html`
              <div key=${option.value} id=${`${id}-option-${index}`} role="option" aria-selected=${value === option.value}
                class="select-option ${active === index ? 'is-active' : ''} ${value === option.value ? 'is-selected' : ''}"
                onPointerDown=${(event) => event.preventDefault()}
                onPointerMove=${(event) => { if (event.pointerType === 'mouse') setActive(index) }} onClick=${() => choose(option)}>
                <span>${option.label}</span>${value === option.value ? html`<${Icon} name="check" />` : null}
              </div>
            `)}
            ${!filtered.length ? html`<p class="select-empty">${t('common.noOptions')}</p>` : null}
          </div>
        </div>
      ` : null}
    </div>
  `
}
