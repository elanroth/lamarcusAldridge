import { ROSTER_SLOT_DEFINITIONS } from './constants'

/** Parse a position string like "2B/SS" → ["2B", "SS"] */
export function parsePositions(posStr) {
  if (!posStr) return []
  return posStr.split('/').map(p => p.trim().toUpperCase())
}

/** Returns which roster slot types a player is eligible for */
export function eligibleSlots(positionStr) {
  const positions = parsePositions(positionStr)
  return ROSTER_SLOT_DEFINITIONS.filter(def =>
    positions.some(p => def.eligible.includes(p))
  )
}

/** Given a team's current roster (array of player objects), return how many
 *  of each slot type are still open. */
export function openSlotsForTeam(teamPlayers) {
  const counts = {}
  for (const def of ROSTER_SLOT_DEFINITIONS) {
    const filled = teamPlayers.filter(p => p.rosterSlot === def.slot).length
    counts[def.slot] = def.count - filled
  }
  return counts
}

/** Returns roster slot options (with open counts) for a player on a given team */
export function availableSlotsForPlayer(positionStr, teamPlayers) {
  const eligible = eligibleSlots(positionStr)
  const open = openSlotsForTeam(teamPlayers)
  return eligible.filter(def => open[def.slot] > 0).map(def => ({
    slot: def.slot,
    label: def.label,
    remaining: open[def.slot],
  }))
}

/** Generate a simple unique id */
export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** Calculate remaining budget for a team given the full players list */
export function remainingBudget(team, allPlayers) {
  const spent = allPlayers
    .filter(p => p.teamId === team.id && p.purchasedPrice != null && p.status !== 'rookie_keeper')
    .reduce((sum, p) => sum + p.purchasedPrice, 0)
  return team.budget - spent
}

/** Normalise CSV header names to camelCase keys we expect */
export function normaliseHeaders(row) {
  const map = {}
  for (const [key, val] of Object.entries(row)) {
    const k = key.toLowerCase().replace(/\s+/g, '')
    if (['name', 'playername', 'player'].includes(k)) map.name = val
    else if (['position', 'pos'].includes(k)) map.position = val
    else if (['projectedvalue', 'projection', 'proj', 'projvalue', 'projectedval'].includes(k)) map.projectedValue = val
    else if (['dollarvalue', 'value', 'dollarval', '$value', 'auctionvalue'].includes(k)) map.dollarValue = val
  }
  return map
}
