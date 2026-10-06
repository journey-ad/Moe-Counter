export type PageName = 'home' | 'rank' | 'view'
export type LanguageCode = 'en' | 'zh' | 'ja'
export type TrackEvent = (type: string, category: string, label: string) => void
export type CopyCode = (text: string, key: string) => Promise<void>
export type NumberFormatter = (value: number | string | null | undefined, type?: 'integer' | 'rate' | 'percent') => string
export type TranslationValues = Record<string, string | number>
export type Translate = (key: string, values?: TranslationValues) => string

export interface Theme {
  name: string
  groups: string[]
}

export interface ThemeGroup {
  id: string
}

export interface PageProps {
  site: string
  themes: Theme[]
  groups: ThemeGroup[]
  name: string
}

export interface GlobalData extends PageProps {
  page: PageName
}

export interface CounterConfig {
  name: string
  theme: string
  padding: string
  offset: string
  scale: string
  align: string
  pixelated: boolean
  darkmode: string
  num: string
  prefix: string
}

export type StringConfigKey = Exclude<keyof CounterConfig, 'pixelated'>
export type ChangeConfig = <Key extends keyof CounterConfig>(key: Key, value: CounterConfig[Key]) => void

export interface FieldDefinition {
  key: keyof CounterConfig
  control: 'text' | 'select' | 'number' | 'switch'
  maxLength?: number
  min?: string
  max?: string
  step?: string
  digitsOnly?: boolean
  signed?: boolean
  decimal?: boolean
  placeholder?: string
}

export interface SelectOption {
  value: string
  label: string
  preview?: string
}

export interface BreakdownRow {
  name: string
  total: number
}

export interface Metrics {
  total: number
  calls24h: number
  rpm: number | null
}

export interface RankRow extends Metrics {
  name: string
}

export interface RankData {
  updatedAt: number
  rpmReady: boolean
  site: Metrics
  unknown: Metrics
  countries: BreakdownRow[]
  languages: BreakdownRow[]
  counters: RankRow[]
  sources: RankRow[]
}

export interface SummaryData {
  updatedAt: number
  rpmReady: boolean
  site: Metrics
}

export interface TrafficData {
  updatedAt: number
  granularity?: 'minute' | 'hour'
  start: number
  end: number
  points: { time: number; count: number | null }[]
}

export interface SeriesData extends TrafficData {
  name: string
  total: number | string
  calls24h: number
  rank24h: { position: number | null; total: number }
  partial: boolean
  countries: BreakdownRow[]
  languages: BreakdownRow[]
}

export interface TrafficLabels {
  description: string
  empty: string
  missing: string
  requests: (count: string) => string
}
