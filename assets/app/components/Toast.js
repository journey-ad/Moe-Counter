import { html } from '../lib/html.js'
import { Icon } from './ui.js'

export function Toast({ message, visible }) {
  return html`
    <div class="toast ${visible ? 'is-visible' : ''}" role="status" aria-live="polite">
      <${Icon} name="check" />
      <span>${message}</span>
    </div>
  `
}
