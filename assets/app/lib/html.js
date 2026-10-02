// htm bound to preact's h, so template literals work as JSX
import { h } from 'preact'
import htm from 'htm'

export const html = htm.bind(h)
