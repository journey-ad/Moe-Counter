import type { JSX } from 'preact'
import type { SelectOption } from '../types'
import { useEffect, useRef, useState } from 'preact/hooks'
import { useLanguage } from '../hooks/useLanguage'
import { Icon } from './ui'

export function Select({
  id,
  value,
  options,
  onChange,
  searchable = false,
  wide = false
}: {
  id: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  searchable?: boolean
  wide?: boolean
}) {
  const { t } = useLanguage()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [placement, setPlacement] = useState('bottom')
  const [align, setAlign] = useState('left')
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
    if (!trigger.current) return
    const rect = trigger.current.getBoundingClientRect()
    const header = document.querySelector<HTMLElement>('.site-header')?.offsetHeight || 0
    const banner = document.querySelector<HTMLElement>('.sponsor-banner')?.offsetHeight || 0
    const below = window.innerHeight - rect.bottom - banner - 12
    const above = rect.top - header - 12
    const upwards = below < 260 && above > below
    const popupWidth = Math.max(rect.width, wide ? 320 : 0)
    const flip = rect.left + popupWidth > window.innerWidth - 12
    setPlacement(upwards ? 'top' : 'bottom')
    setAlign(flip ? 'right' : 'left')
    setHeight(Math.max(100, Math.min(460, upwards ? above : below)))
    setQuery('')
    setActive(
      Math.max(
        0,
        options.findIndex((option) => option.value === value)
      )
    )
    setOpen(true)
  }

  const choose = (option?: SelectOption) => {
    if (!option) return
    onChange(option.value)
    close(true)
  }

  useEffect(() => {
    if (!open) return
    if (searchable) search.current?.focus()
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node | null)) close()
    }
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

  const handleKey = (event: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
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

  return (
    <div
      ref={root}
      class={'custom-select ' + (wide ? 'is-wide' : '') + ' ' + (open ? 'is-open' : '')}
      onKeyDown={handleKey}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close()
      }}
    >
      <button
        ref={trigger}
        id={id}
        type="button"
        class="select-trigger"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={`${id}-hint`}
        aria-activedescendant={open && !searchable ? activeId : undefined}
        onClick={() => (open ? close() : show())}
      >
        {selected?.preview ? <img class="select-trigger-preview" src={selected.preview} alt="" /> : null}
        <span id={`${id}-value`}>{selected?.label || value}</span>
        <Icon name="chevron-down" />
      </button>
      {open ? (
        <div
          class={'select-popup select-popup--' + placement + ' select-popup--' + align}
          style={`--select-max-height: ${height}px`}
        >
          {searchable ? (
            <div class="select-search">
              <Icon name="search" />
              <input
                ref={search}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-autocomplete="list"
                aria-controls={listId}
                aria-activedescendant={activeId}
                aria-label={t('themes.search.label')}
                placeholder={t('themes.search.placeholder')}
                value={query}
                autocomplete="off"
                onInput={(event) => {
                  setQuery(event.currentTarget.value)
                  setActive(0)
                }}
              />
            </div>
          ) : null}
          <div id={listId} class="select-options" role="listbox" aria-labelledby={`${id}-label`}>
            {filtered.map((option, index) => (
              <div
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={value === option.value}
                class={
                  'select-option ' +
                  (active === index ? 'is-active' : '') +
                  ' ' +
                  (value === option.value ? 'is-selected' : '')
                }
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={(event) => {
                  if (event.pointerType === 'mouse') setActive(index)
                }}
                onClick={() => choose(option)}
              >
                {option.preview ? (
                  <img class="select-option-preview" src={option.preview} alt="" loading="lazy" decoding="async" />
                ) : null}
                <span>{option.label}</span>
                {value === option.value ? <Icon name="check" /> : null}
              </div>
            ))}
            {!filtered.length ? <p class="select-empty">{t('common.noOptions')}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
