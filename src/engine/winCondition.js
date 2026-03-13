import { getCompleteSets } from './properties.js'

export function checkWinCondition(player) {
  if (!player || !player.properties) return false
  const completeSets = getCompleteSets(player.properties)
  return completeSets.length >= 3
}
