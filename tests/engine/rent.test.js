import { describe, it, expect } from 'vitest'
import { calculateRent } from '../../src/engine/rent.js'
import { PROPERTY_CONFIG } from '../../src/engine/cards.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a mock property card for a given color.
 * Uses PROPERTY_CONFIG to set correct rent and setSize.
 */
function mockPropertyCard(color, name, index) {
  const config = PROPERTY_CONFIG[color]
  return {
    id: `test-${color}-${index}`,
    type: 'property',
    name,
    value: 1,
    color,
    rent: config.rent,
    setSize: config.setSize,
  }
}

/**
 * Build a mock player with properties and optional enhancements.
 * @param {Object} colorCardCounts - e.g. { brown: 2, green: 1 }
 * @param {Object} [options] - { house: 'color', hotel: 'color' } to add enhancements
 */
function buildPlayer(colorCardCounts, options = {}) {
  const properties = {}

  for (const [color, count] of Object.entries(colorCardCounts)) {
    const config = PROPERTY_CONFIG[color]
    const cards = []
    for (let i = 0; i < count; i++) {
      cards.push(mockPropertyCard(color, config.names[i] || `${color}-${i}`, i))
    }
    properties[color] = cards
  }

  const houses = {}
  const hotels = {}
  if (options.house) houses[options.house] = true
  if (options.hotel) hotels[options.hotel] = true

  return { properties, houses, hotels, hand: [], bank: [] }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('calculateRent', () => {
  describe('empty / missing properties', () => {
    it('should return 0 for empty properties object', () => {
      expect(calculateRent({}, 'brown')).toBe(0)
    })

    it('should return 0 when the color has no cards', () => {
      const properties = buildPlayer({ green: 2 })
      expect(calculateRent(properties, 'brown')).toBe(0)
    })

    it('should return 0 for undefined properties', () => {
      expect(calculateRent(undefined, 'brown')).toBe(0)
    })

    it('should return 0 for null properties', () => {
      expect(calculateRent(null, 'brown')).toBe(0)
    })
  })

  describe('brown (setSize 2, rent [1,2])', () => {
    it('should return $1 for 1 brown property', () => {
      const properties = buildPlayer({ brown: 1 })
      expect(calculateRent(properties, 'brown')).toBe(1)
    })

    it('should return $2 for 2 brown properties (complete set)', () => {
      const properties = buildPlayer({ brown: 2 })
      expect(calculateRent(properties, 'brown')).toBe(2)
    })
  })

  describe('darkblue (setSize 2, rent [3,8])', () => {
    it('should return $3 for 1 dark blue property', () => {
      const properties = buildPlayer({ darkblue: 1 })
      expect(calculateRent(properties, 'darkblue')).toBe(3)
    })

    it('should return $8 for 2 dark blue properties (complete set)', () => {
      const properties = buildPlayer({ darkblue: 2 })
      expect(calculateRent(properties, 'darkblue')).toBe(8)
    })
  })

  describe('green (setSize 3, rent [2,4,7])', () => {
    it('should return $2 for 1 green property', () => {
      const properties = buildPlayer({ green: 1 })
      expect(calculateRent(properties, 'green')).toBe(2)
    })

    it('should return $4 for 2 green properties', () => {
      const properties = buildPlayer({ green: 2 })
      expect(calculateRent(properties, 'green')).toBe(4)
    })

    it('should return $7 for 3 green properties (complete set)', () => {
      const properties = buildPlayer({ green: 3 })
      expect(calculateRent(properties, 'green')).toBe(7)
    })
  })

  describe('railroad (setSize 4, rent [1,2,3,4])', () => {
    it('should return $1 for 1 railroad', () => {
      const properties = buildPlayer({ railroad: 1 })
      expect(calculateRent(properties, 'railroad')).toBe(1)
    })

    it('should return $2 for 2 railroads', () => {
      const properties = buildPlayer({ railroad: 2 })
      expect(calculateRent(properties, 'railroad')).toBe(2)
    })

    it('should return $3 for 3 railroads', () => {
      const properties = buildPlayer({ railroad: 3 })
      expect(calculateRent(properties, 'railroad')).toBe(3)
    })

    it('should return $4 for 4 railroads (complete set)', () => {
      const properties = buildPlayer({ railroad: 4 })
      expect(calculateRent(properties, 'railroad')).toBe(4)
    })
  })

  describe('lightblue (setSize 3, rent [1,2,3])', () => {
    it('should return $1 for 1 light blue property', () => {
      const properties = buildPlayer({ lightblue: 1 })
      expect(calculateRent(properties, 'lightblue')).toBe(1)
    })

    it('should return $3 for complete light blue set', () => {
      const properties = buildPlayer({ lightblue: 3 })
      expect(calculateRent(properties, 'lightblue')).toBe(3)
    })
  })

  describe('house and hotel bonuses', () => {
    it('should add $3 rent for a house on a complete set', () => {
      const properties = buildPlayer({ brown: 2 }, { house: 'brown' })
      // Base rent for complete brown = $2, plus house = +$3 = $5
      expect(calculateRent(properties, 'brown')).toBe(5)
    })

    it('should add $4 more rent for a hotel (on top of house)', () => {
      const properties = buildPlayer(
        { brown: 2 },
        { house: 'brown', hotel: 'brown' },
      )
      // Base rent for complete brown = $2, house = +$3, hotel = +$4 = $9
      expect(calculateRent(properties, 'brown')).toBe(9)
    })

    it('should add house bonus to darkblue complete set', () => {
      const properties = buildPlayer({ darkblue: 2 }, { house: 'darkblue' })
      // Base rent = $8, house = +$3 = $11
      expect(calculateRent(properties, 'darkblue')).toBe(11)
    })

    it('should add house and hotel bonus to darkblue complete set', () => {
      const properties = buildPlayer(
        { darkblue: 2 },
        { house: 'darkblue', hotel: 'darkblue' },
      )
      // Base rent = $8, house = +$3, hotel = +$4 = $15
      expect(calculateRent(properties, 'darkblue')).toBe(15)
    })

    it('should not add house bonus to incomplete set', () => {
      const properties = buildPlayer({ green: 2 }, { house: 'green' })
      // Incomplete set: house should not add bonus (or engine ignores it)
      // Base rent for 2 green = $4 -- house on incomplete set = still $4
      expect(calculateRent(properties, 'green')).toBe(4)
    })
  })
})
