'use strict'

/**
 * Data access contract. Every driver module has to export each method listed here;
 * db/index.js refuses to load a driver that is missing one.
 */
const INTERFACE = [
  'getNum', 'getAll', 'setNum', 'setNumMulti', 'initStats', 'getStats',
  'writeSnapshot', 'getRank', 'getSummary', 'getTraffic', 'getSeries', 'maintainStats', 'close'
]

module.exports = { INTERFACE }
