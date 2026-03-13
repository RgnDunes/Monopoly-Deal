import { describe, it, expect } from 'vitest'
import { checkWinCondition } from '../../src/engine/winCondition.js'
import { PROPERTY_CONFIG } from '../../src/engine/cards.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
 * Build a complete property set for a given color.
 */
function buildCompleteSet(color) {
  const config = PROPERTY_CONFIG[color]
  return config.names.map((name, i) => mockPropertyCard(color, name, i))
}

/**
 * Build a player object with the given complete-set colors in their properties.
 */
function buildPlayer(completedColors, incompleteColors = {}) {
  const properties = {}

  for (const color of completedColors) {
    properties[color] = buildCompleteSet(color)
  }

  for (const [color, count] of Object.entries(incompleteColors)) {
    const config = PROPERTY_CONFIG[color]
    properties[color] = config.names
      .slice(0, count)
      .map((name, i) => mockPropertyCard(color, name, i))
  }

  return {
    id: 'test-player',
    name: 'Test Player',
    hand: [],
    bank: [],
    properties,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('checkWinCondition', () => {
  it('should return false for a player with 0 complete sets', () => {
    const player = buildPlayer([], { brown: 1, green: 2 })
    expect(checkWinCondition(player)).toBe(false)
  })

  it('should return false for a player with 1 complete set', () => {
    const player = buildPlayer(['brown'])
    expect(checkWinCondition(player)).toBe(false)
  })

  it('should return false for a player with 2 complete sets', () => {
    const player = buildPlayer(['brown', 'darkblue'])
    expect(checkWinCondition(player)).toBe(false)
  })

  it('should return true for a player with 3 complete sets', () => {
    const player = buildPlayer(['brown', 'darkblue', 'utility'])
    expect(checkWinCondition(player)).toBe(true)
  })

  it('should return true for a player with more than 3 complete sets', () => {
    const player = buildPlayer(['brown', 'darkblue', 'utility', 'lightblue'])
    expect(checkWinCondition(player)).toBe(true)
  })

  it('should return false for a player with no properties at all', () => {
    const player = buildPlayer([])
    expect(checkWinCondition(player)).toBe(false)
  })

  it('should not count incomplete sets toward the win condition', () => {
    // 2 complete sets + several incomplete ones should still be false
    const player = buildPlayer(['brown', 'darkblue'], {
      green: 2,
      red: 2,
      orange: 2,
      yellow: 1,
    })
    expect(checkWinCondition(player)).toBe(false)
  })

  it('should return true for 3 complete sets of different sizes', () => {
    // brown (2), lightblue (3), railroad (4) = 3 complete sets
    const player = buildPlayer(['brown', 'lightblue', 'railroad'])
    expect(checkWinCondition(player)).toBe(true)
  })

  it('should return false for null player', () => {
    expect(checkWinCondition(null)).toBe(false)
  })

  it('should return false for undefined player', () => {
    expect(checkWinCondition(undefined)).toBe(false)
  })

  it('should return false for player with empty properties object', () => {
    const player = {
      id: 'test-player',
      name: 'Test Player',
      hand: [],
      bank: [],
      properties: {},
    }
    expect(checkWinCondition(player)).toBe(false)
  })
})
