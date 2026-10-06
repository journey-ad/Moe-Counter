import { Icon } from './ui'

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div class={'toast ' + (visible ? 'is-visible' : '')} role="status" aria-live="polite">
      <Icon name="check" />
      <span>{message}</span>
    </div>
  )
}
