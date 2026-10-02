// htm 绑定到 preact 的 h，模板字面量即可当 JSX 用
import { h } from 'preact'
import htm from 'htm'

export const html = htm.bind(h)
