export function readGlobalData() {
  const node = document.getElementById('global-data')
  const fallback = { site: '', page: 'home', name: '', groups: [], themes: [] }

  try {
    return { ...fallback, ...JSON.parse(node?.textContent || '{}') }
  } catch {
    return fallback
  }
}

// Fixed number for previews, short enough to show the zero padding
export const PREVIEW_NUMBER = '514'
export const PREVIEW_NAME = 'preview'

export const defaultConfig = {
  name: '',
  theme: 'random',
  padding: '7',
  offset: '0',
  scale: '1',
  align: 'top',
  pixelated: true,
  darkmode: 'auto',
  num: '0',
  prefix: ''
}

export const fieldGroups = [
  {
    id: 'basic',
    fields: [
      {
        key: 'name',
        control: 'text',
        maxLength: 32
      },
      {
        key: 'theme',
        control: 'select'
      },
      {
        key: 'padding',
        control: 'number',
        min: '1',
        max: '16',
        step: '1',
        digitsOnly: true
      },
      {
        key: 'offset',
        control: 'number',
        min: '-500',
        max: '500',
        step: '1',
        signed: true
      },
      {
        key: 'scale',
        control: 'number',
        min: '0.1',
        max: '2',
        step: '0.1',
        decimal: true
      },
      {
        key: 'align',
        control: 'select'
      },
      {
        key: 'pixelated',
        control: 'switch'
      },
      {
        key: 'darkmode',
        control: 'select'
      }
    ]
  },
  {
    id: 'advanced',
    fields: [
      {
        key: 'num',
        control: 'number',
        min: '0',
        max: '1e15',
        step: '1',
        digitsOnly: true
      },
      {
        key: 'prefix',
        control: 'number',
        min: '0',
        max: '999999',
        step: '1',
        digitsOnly: true
      }
    ]
  }
]

export const alignOptions = ['top', 'center', 'bottom']
export const darkmodeOptions = [
  { value: 'auto', label: 'auto' },
  { value: '1', label: 'yes' },
  { value: '0', label: 'no' }
]

// Same defaults as the server-side zod schema
export function buildParams(config) {
  const params = {
    theme: config.theme || 'moebooru',
    padding: config.padding || '7',
    offset: config.offset || '0',
    align: config.align || 'top',
    scale: config.scale || '1',
    pixelated: config.pixelated ? '1' : '0',
    darkmode: config.darkmode || 'auto'
  }

  if (Number(config.num) > 0) params.num = config.num
  if (config.prefix !== '') params.prefix = config.prefix

  return params
}

// Embed URL for the user, carrying the real name
export function buildEmbedUrl(site, config) {
  const query = new URLSearchParams(buildParams(config))
  return `${site}/@${encodeURIComponent(config.name.trim())}?${query}`
}

// Previews always take the num branch, which never writes to the database
export function buildPreviewUrl(site, config) {
  const params = buildParams(config)
  if (!(Number(config.num) > 0)) params.num = PREVIEW_NUMBER

  return `${site}/@${PREVIEW_NAME}?${new URLSearchParams(params)}`
}

export function buildUsageSnippets(site) {
  const target = `${site}/@:name`

  return [
    {
      step: '01',
      id: 'url',
      code: target
    },
    {
      step: '02',
      id: 'html',
      code: `<img src="${target}" alt=":name" />`
    },
    {
      step: '03',
      id: 'markdown',
      code: `![:name](${target})`
    }
  ]
}
