import { PROPERTY_CONFIG } from './cards.js'
import { countPropertyCards, isSetComplete, hasHouse, hasHotel } from './properties.js'

export function calculateRent(properties, color) {
  if (!properties) return 0

  const config = PROPERTY_CONFIG[color]
  if (!config) return 0

  const count = countPropertyCards(properties, color)
  if (count === 0) return 0

  const rentIndex = Math.min(count, config.rent.length) - 1
  let rent = config.rent[rentIndex]

  if (isSetComplete(properties, color)) {
    if (hasHouse(properties, color)) rent += 3
    if (hasHotel(properties, color)) rent += 4
  }

  return rent
}
