import type party from 'party-js'
import type VectorMap from 'jsvectormap'
import type { TrackEvent } from '../types'

declare global {
  interface Window {
    party: typeof party
    jsVectorMap: typeof VectorMap
    _evt_push?: TrackEvent
  }
}
