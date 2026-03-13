import { PROPERTY_CONFIG } from './cards.js'

export function getSetSize(color) {
  return PROPERTY_CONFIG[color]?.setSize || 0
}

export function countPropertyCards(properties, color) {
  if (!properties || !properties[color]) return 0
  return properties[color].length
}

export function isSetComplete(properties, color) {
  const needed = getSetSize(color)
  return needed > 0 && countPropertyCards(properties, color) >= needed
}

export function getCompleteSets(properties) {
  if (!properties) return []
  return Object.keys(properties).filter(color => isSetComplete(properties, color))
}

export function hasHouse(properties, color) {
  return properties[color]?.hasHouse === true
}

export function hasHotel(properties, color) {
  return properties[color]?.hasHotel === true
}
