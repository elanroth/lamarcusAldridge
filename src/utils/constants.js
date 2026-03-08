export const TOTAL_BUDGET = 260

export const ROSTER_SLOT_DEFINITIONS = [
  { slot: 'C',    label: 'C',    count: 2, eligible: ['C'] },
  { slot: '1B',   label: '1B',   count: 1, eligible: ['1B'] },
  { slot: '2B',   label: '2B',   count: 1, eligible: ['2B'] },
  { slot: '3B',   label: '3B',   count: 1, eligible: ['3B'] },
  { slot: 'SS',   label: 'SS',   count: 1, eligible: ['SS'] },
  { slot: 'MI',   label: 'MI',   count: 1, eligible: ['2B', 'SS'] },
  { slot: 'CI',   label: 'CI',   count: 1, eligible: ['1B', '3B'] },
  { slot: 'OF',   label: 'OF',   count: 5, eligible: ['OF'] },
  { slot: 'UTIL', label: 'UTIL', count: 1, eligible: ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH'] },
  { slot: 'P',    label: 'P',    count: 9, eligible: ['SP', 'RP', 'P'] },
]

export const TOTAL_ROSTER_SPOTS = ROSTER_SLOT_DEFINITIONS.reduce((sum, s) => sum + s.count, 0)

// All position tags that can appear in CSV
export const ALL_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP', 'P', 'DH']
