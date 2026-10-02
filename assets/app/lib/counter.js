export function readGlobalData() {
  const node = document.getElementById('global-data')
  const fallback = { site: '', groups: [], themes: [] }

  try {
    return { ...fallback, ...JSON.parse(node?.textContent || '{}') }
  } catch {
    return fallback
  }
}

// 预览用的固定数字，短到能看出 padding 的补零效果
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

// 与服务端 zod 校验保持同一套默认值
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

// 给用户的嵌入地址，带真实名字
export function buildEmbedUrl(site, config) {
  const query = new URLSearchParams(buildParams(config))
  return `${site}/@${encodeURIComponent(config.name.trim())}?${query}`
}

// 预览始终走 num 分支，服务端在这条分支上不会写库，因此不会影响真实计数
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
