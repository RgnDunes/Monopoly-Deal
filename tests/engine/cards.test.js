import { describe, it, expect } from 'vitest'
import { ALL_CARDS, PROPERTY_CONFIG } from '../../src/engine/cards.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cardsByType(type) {
  return ALL_CARDS.filter(c => c.type === type)
}

function moneyCardsOfValue(value) {
  return ALL_CARDS.filter(c => c.type === 'money' && c.value === value)
}

function propertiesOfColor(color) {
  return ALL_CARDS.filter(c => c.type === 'property' && c.color === color)
}

function actionCardsByName(name) {
  return ALL_CARDS.filter(c => c.type === 'action' && c.name === name)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ALL_CARDS', () => {
  describe('total card count', () => {
    it('should contain 107 cards total', () => {
      // 20 money + 28 property + 11 wild + 35 action + 13 rent = 107
      expect(ALL_CARDS.length).toBe(107)
    })
  })

  describe('money cards', () => {
    const moneyCards = cardsByType('money')

    it('should have 20 money cards total', () => {
      expect(moneyCards.length).toBe(20)
    })

    it('should have 6x $1 money cards', () => {
      expect(moneyCardsOfValue(1).length).toBe(6)
    })

    it('should have 5x $2 money cards', () => {
      expect(moneyCardsOfValue(2).length).toBe(5)
    })

    it('should have 3x $3 money cards', () => {
      expect(moneyCardsOfValue(3).length).toBe(3)
    })

    it('should have 3x $4 money cards', () => {
      expect(moneyCardsOfValue(4).length).toBe(3)
    })

    it('should have 2x $5 money cards', () => {
      expect(moneyCardsOfValue(5).length).toBe(2)
    })

    it('should have 1x $10 money card', () => {
      expect(moneyCardsOfValue(10).length).toBe(1)
    })
  })

  describe('property cards', () => {
    const propertyCards = cardsByType('property')

    it('should have 28 property cards total', () => {
      expect(propertyCards.length).toBe(28)
    })

    it('should have 2 brown properties', () => {
      expect(propertiesOfColor('brown').length).toBe(2)
    })

    it('should have 3 light blue properties', () => {
      expect(propertiesOfColor('lightblue').length).toBe(3)
    })

    it('should have 3 pink properties', () => {
      expect(propertiesOfColor('pink').length).toBe(3)
    })

    it('should have 3 orange properties', () => {
      expect(propertiesOfColor('orange').length).toBe(3)
    })

    it('should have 3 red properties', () => {
      expect(propertiesOfColor('red').length).toBe(3)
    })

    it('should have 3 yellow properties', () => {
      expect(propertiesOfColor('yellow').length).toBe(3)
    })

    it('should have 3 green properties', () => {
      expect(propertiesOfColor('green').length).toBe(3)
    })

    it('should have 2 dark blue properties', () => {
      expect(propertiesOfColor('darkblue').length).toBe(2)
    })

    it('should have 4 railroad properties', () => {
      expect(propertiesOfColor('railroad').length).toBe(4)
    })

    it('should have 2 utility properties', () => {
      expect(propertiesOfColor('utility').length).toBe(2)
    })
  })

  describe('wild cards', () => {
    const wildCards = cardsByType('wild')

    it('should have 11 wild cards total', () => {
      expect(wildCards.length).toBe(11)
    })

    it('should have 2 rainbow wilds', () => {
      const rainbows = wildCards.filter(c => c.isRainbowWild)
      expect(rainbows.length).toBe(2)
    })

    it('should have 9 two-color wilds', () => {
      const twoColor = wildCards.filter(c => !c.isRainbowWild)
      expect(twoColor.length).toBe(9)
    })

    it('rainbow wilds should have isRainbowWild set to true', () => {
      const rainbows = wildCards.filter(c => c.isRainbowWild)
      rainbows.forEach(card => {
        expect(card.isRainbowWild).toBe(true)
      })
    })

    it('rainbow wilds should list all 10 colors', () => {
      const allColors = Object.keys(PROPERTY_CONFIG)
      const rainbows = wildCards.filter(c => c.isRainbowWild)
      rainbows.forEach(card => {
        expect(card.colors).toEqual(expect.arrayContaining(allColors))
        expect(card.colors.length).toBe(allColors.length)
      })
    })

    it('each two-color wild should have exactly 2 colors', () => {
      const twoColor = wildCards.filter(c => !c.isRainbowWild)
      twoColor.forEach(card => {
        expect(card.colors).toHaveLength(2)
      })
    })

    it('non-rainbow wilds should have isRainbowWild set to false', () => {
      const twoColor = wildCards.filter(c => !c.isRainbowWild)
      twoColor.forEach(card => {
        expect(card.isRainbowWild).toBe(false)
      })
    })
  })

  describe('action cards', () => {
    const actionCards = cardsByType('action')

    it('should have 35 action cards total', () => {
      expect(actionCards.length).toBe(35)
    })

    it('should have 10 Pass Go cards', () => {
      expect(actionCardsByName('Pass Go').length).toBe(10)
    })

    it('should have 2 Deal Breaker cards', () => {
      expect(actionCardsByName('Deal Breaker').length).toBe(2)
    })

    it('should have 3 Sly Deal cards', () => {
      expect(actionCardsByName('Sly Deal').length).toBe(3)
    })

    it('should have 4 Forced Deal cards', () => {
      expect(actionCardsByName('Forced Deal').length).toBe(4)
    })

    it('should have 3 Debt Collector cards', () => {
      expect(actionCardsByName('Debt Collector').length).toBe(3)
    })

    it("should have 3 It's My Birthday cards", () => {
      expect(actionCardsByName("It's My Birthday").length).toBe(3)
    })

    it('should have 3 Just Say No cards', () => {
      expect(actionCardsByName('Just Say No').length).toBe(3)
    })

    it('should have 2 Double the Rent cards', () => {
      expect(actionCardsByName('Double the Rent').length).toBe(2)
    })

    it('should have 3 House cards', () => {
      expect(actionCardsByName('House').length).toBe(3)
    })

    it('should have 2 Hotel cards', () => {
      expect(actionCardsByName('Hotel').length).toBe(2)
    })
  })

  describe('rent cards', () => {
    const rentCards = cardsByType('rent')

    it('should have 13 rent cards total', () => {
      expect(rentCards.length).toBe(13)
    })

    it('should have 3 Any Color rent cards', () => {
      const anyColor = rentCards.filter(c => c.targetsAll === false)
      expect(anyColor.length).toBe(3)
    })

    it('should have 10 two-color rent cards', () => {
      const twoColor = rentCards.filter(c => c.targetsAll === true)
      expect(twoColor.length).toBe(10)
    })

    it('should have 2 brown/lightblue rent cards', () => {
      const bl = rentCards.filter(
        c =>
          c.targetsAll === true &&
          c.rentColors.includes('brown') &&
          c.rentColors.includes('lightblue'),
      )
      expect(bl.length).toBe(2)
    })

    it('should have 2 pink/orange rent cards', () => {
      const po = rentCards.filter(
        c =>
          c.targetsAll === true &&
          c.rentColors.includes('pink') &&
          c.rentColors.includes('orange'),
      )
      expect(po.length).toBe(2)
    })

    it('should have 2 red/yellow rent cards', () => {
      const ry = rentCards.filter(
        c =>
          c.targetsAll === true &&
          c.rentColors.includes('red') &&
          c.rentColors.includes('yellow'),
      )
      expect(ry.length).toBe(2)
    })

    it('should have 2 green/darkblue rent cards', () => {
      const gd = rentCards.filter(
        c =>
          c.targetsAll === true &&
          c.rentColors.includes('green') &&
          c.rentColors.includes('darkblue'),
      )
      expect(gd.length).toBe(2)
    })

    it('should have 2 railroad/utility rent cards', () => {
      const ru = rentCards.filter(
        c =>
          c.targetsAll === true &&
          c.rentColors.includes('railroad') &&
          c.rentColors.includes('utility'),
      )
      expect(ru.length).toBe(2)
    })
  })

  describe('card field validation', () => {
    it('every card should have an id', () => {
      ALL_CARDS.forEach(card => {
        expect(card.id).toBeDefined()
        expect(typeof card.id).toBe('string')
        expect(card.id.length).toBeGreaterThan(0)
      })
    })

    it('every card should have a type', () => {
      ALL_CARDS.forEach(card => {
        expect(card.type).toBeDefined()
        expect(['property', 'money', 'action', 'rent', 'wild']).toContain(card.type)
      })
    })

    it('every card should have a name', () => {
      ALL_CARDS.forEach(card => {
        expect(card.name).toBeDefined()
        expect(typeof card.name).toBe('string')
        expect(card.name.length).toBeGreaterThan(0)
      })
    })

    it('every card should have a numeric value', () => {
      ALL_CARDS.forEach(card => {
        expect(card.value).toBeDefined()
        expect(typeof card.value).toBe('number')
        expect(card.value).toBeGreaterThanOrEqual(0)
      })
    })

    it('every card should have a unique id', () => {
      const ids = ALL_CARDS.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('property card details', () => {
    const propertyCards = cardsByType('property')

    it('all property cards should have correct setSize matching PROPERTY_CONFIG', () => {
      propertyCards.forEach(card => {
        const config = PROPERTY_CONFIG[card.color]
        expect(config).toBeDefined()
        expect(card.setSize).toBe(config.setSize)
      })
    })

    it('all property cards should have correct rent arrays matching PROPERTY_CONFIG', () => {
      propertyCards.forEach(card => {
        const config = PROPERTY_CONFIG[card.color]
        expect(card.rent).toEqual(config.rent)
      })
    })

    it('property card rent array length should equal setSize', () => {
      propertyCards.forEach(card => {
        expect(card.rent.length).toBe(card.setSize)
      })
    })
  })
})

describe('PROPERTY_CONFIG', () => {
  const expectedColors = [
    'brown',
    'lightblue',
    'pink',
    'orange',
    'red',
    'yellow',
    'green',
    'darkblue',
    'railroad',
    'utility',
  ]

  it('should have all 10 colors', () => {
    const colors = Object.keys(PROPERTY_CONFIG)
    expect(colors).toEqual(expect.arrayContaining(expectedColors))
    expect(colors.length).toBe(10)
  })

  it('each color should have setSize, rent, and names', () => {
    expectedColors.forEach(color => {
      const config = PROPERTY_CONFIG[color]
      expect(config).toBeDefined()
      expect(typeof config.setSize).toBe('number')
      expect(Array.isArray(config.rent)).toBe(true)
      expect(Array.isArray(config.names)).toBe(true)
    })
  })

  it('rent array length should match setSize for each color', () => {
    expectedColors.forEach(color => {
      const config = PROPERTY_CONFIG[color]
      expect(config.rent.length).toBe(config.setSize)
    })
  })

  it('names array length should match setSize for each color', () => {
    expectedColors.forEach(color => {
      const config = PROPERTY_CONFIG[color]
      expect(config.names.length).toBe(config.setSize)
    })
  })

  it('brown should have setSize 2', () => {
    expect(PROPERTY_CONFIG.brown.setSize).toBe(2)
  })

  it('darkblue should have setSize 2', () => {
    expect(PROPERTY_CONFIG.darkblue.setSize).toBe(2)
  })

  it('railroad should have setSize 4', () => {
    expect(PROPERTY_CONFIG.railroad.setSize).toBe(4)
  })

  it('rent values should be in ascending order for each color', () => {
    expectedColors.forEach(color => {
      const rent = PROPERTY_CONFIG[color].rent
      for (let i = 1; i < rent.length; i++) {
        expect(rent[i]).toBeGreaterThanOrEqual(rent[i - 1])
      }
    })
  })
})
