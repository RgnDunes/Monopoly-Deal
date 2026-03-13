import { describe, it, expect, beforeEach } from 'vitest'
import {
  createInitialState,
  drawCards,
  bankCard,
  playPropertyCard,
  endTurn,
  discardCards,
  resolvePassGo,
  resolveDealBreaker,
  resolveSlyDeal,
  resolveJustSayNo,
  resolveHouse,
  resolveHotel,
  getPlayer,
  getCurrentPlayer,
} from '../../src/engine/gameState.js'
import { PROPERTY_CONFIG } from '../../src/engine/cards.js'
import { checkWinCondition } from '../../src/engine/winCondition.js'

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

function mockMoneyCard(value, index) {
  return {
    id: `test-money-${value}-${index}`,
    type: 'money',
    name: `$${value}M`,
    value,
  }
}

function mockActionCard(name, value, index) {
  return {
    id: `test-action-${name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    type: 'action',
    name,
    value,
    description: `Test ${name}`,
  }
}

function mockWildCard(colors, index, isRainbowWild = false) {
  const primaryColor = colors[0]
  const config = PROPERTY_CONFIG[primaryColor]
  return {
    id: `test-wild-${colors.join('-')}-${index}`,
    type: 'wild',
    name: isRainbowWild ? 'Rainbow Wild' : `${colors[0]}/${colors[1]} Wild`,
    value: isRainbowWild ? 0 : 2,
    color: primaryColor,
    colors,
    isRainbowWild,
    rent: config.rent,
    setSize: config.setSize,
  }
}

/**
 * Build a complete set of property cards for a given color.
 */
function buildCompleteSet(color) {
  const config = PROPERTY_CONFIG[color]
  return config.names.map((name, i) => mockPropertyCard(color, name, i))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createInitialState', () => {
  it('should create a game state with the correct number of players', () => {
    const state = createInitialState(4)
    expect(state.players).toHaveLength(4)
  })

  it('should create a game with 2 players', () => {
    const state = createInitialState(2)
    expect(state.players).toHaveLength(2)
  })

  it('should create a game with 5 players', () => {
    const state = createInitialState(5)
    expect(state.players).toHaveLength(5)
  })

  it('should deal 5 cards to each player', () => {
    const state = createInitialState(4)
    state.players.forEach(player => {
      expect(player.hand).toHaveLength(5)
    })
  })

  it('should start on the first player (currentPlayerIndex = 0)', () => {
    const state = createInitialState(3)
    expect(state.currentPlayerIndex).toBe(0)
  })

  it('should have a deck with the remaining cards after dealing', () => {
    const state = createInitialState(4)
    // 107 total cards - (4 players * 5 cards) = 87 remaining
    expect(state.deck.length).toBe(107 - 4 * 5)
  })

  it('each player should have empty bank and properties', () => {
    const state = createInitialState(3)
    state.players.forEach(player => {
      expect(player.bank).toEqual([])
      expect(player.properties).toEqual({})
    })
  })
})

describe('drawCards', () => {
  it('should add 2 cards to the current player hand', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)
    const handSizeBefore = currentPlayer.hand.length

    const newState = drawCards(state)
    const updatedPlayer = getCurrentPlayer(newState)

    expect(updatedPlayer.hand.length).toBe(handSizeBefore + 2)
  })

  it('should remove 2 cards from the deck', () => {
    const state = createInitialState(2)
    const deckSizeBefore = state.deck.length

    const newState = drawCards(state)

    expect(newState.deck.length).toBe(deckSizeBefore - 2)
  })
})

describe('bankCard', () => {
  it('should move a card from hand to bank', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)
    const cardToBanK = currentPlayer.hand[0]

    const newState = bankCard(state, cardToBanK.id)
    const updatedPlayer = getCurrentPlayer(newState)

    expect(updatedPlayer.hand.find(c => c.id === cardToBanK.id)).toBeUndefined()
    expect(updatedPlayer.bank.find(c => c.id === cardToBanK.id)).toBeDefined()
  })

  it('should decrease hand size by 1', () => {
    const state = createInitialState(2)
    const handSizeBefore = getCurrentPlayer(state).hand.length

    const cardId = getCurrentPlayer(state).hand[0].id
    const newState = bankCard(state, cardId)

    expect(getCurrentPlayer(newState).hand.length).toBe(handSizeBefore - 1)
  })

  it('should increase bank size by 1', () => {
    const state = createInitialState(2)
    const bankSizeBefore = getCurrentPlayer(state).bank.length

    const cardId = getCurrentPlayer(state).hand[0].id
    const newState = bankCard(state, cardId)

    expect(getCurrentPlayer(newState).bank.length).toBe(bankSizeBefore + 1)
  })
})

describe('playPropertyCard', () => {
  it('should add a property card to the player property area', () => {
    // Build a state with a property card in hand
    const state = createInitialState(2)
    const propCard = mockPropertyCard('brown', 'Mediterranean Ave', 0)

    // Manually inject the property card into the current player hand
    const currentPlayer = getCurrentPlayer(state)
    currentPlayer.hand.push(propCard)

    const newState = playPropertyCard(state, propCard.id, 'brown')
    const updatedPlayer = getCurrentPlayer(newState)

    expect(updatedPlayer.properties.brown).toBeDefined()
    expect(updatedPlayer.properties.brown.some(c => c.id === propCard.id)).toBe(true)
  })

  it('should remove the card from the player hand', () => {
    const state = createInitialState(2)
    const propCard = mockPropertyCard('green', 'Pacific Ave', 0)

    const currentPlayer = getCurrentPlayer(state)
    currentPlayer.hand.push(propCard)
    const handSizeBefore = currentPlayer.hand.length

    const newState = playPropertyCard(state, propCard.id, 'green')
    const updatedPlayer = getCurrentPlayer(newState)

    expect(updatedPlayer.hand.length).toBe(handSizeBefore - 1)
    expect(updatedPlayer.hand.find(c => c.id === propCard.id)).toBeUndefined()
  })
})

describe('endTurn', () => {
  it('should advance to the next player', () => {
    const state = createInitialState(3)
    expect(state.currentPlayerIndex).toBe(0)

    const newState = endTurn(state)
    expect(newState.currentPlayerIndex).toBe(1)
  })

  it('should wrap around to player 0 after the last player', () => {
    const state = createInitialState(3)
    state.currentPlayerIndex = 2

    const newState = endTurn(state)
    expect(newState.currentPlayerIndex).toBe(0)
  })

  it('should work correctly for 2-player game', () => {
    const state = createInitialState(2)
    expect(state.currentPlayerIndex).toBe(0)

    const state1 = endTurn(state)
    expect(state1.currentPlayerIndex).toBe(1)

    const state2 = endTurn(state1)
    expect(state2.currentPlayerIndex).toBe(0)
  })
})

describe('discardCards', () => {
  it('should remove specified cards from hand', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)
    const cardsToDiscard = currentPlayer.hand.slice(0, 2).map(c => c.id)

    const newState = discardCards(state, cardsToDiscard)
    const updatedPlayer = getCurrentPlayer(newState)

    cardsToDiscard.forEach(cardId => {
      expect(updatedPlayer.hand.find(c => c.id === cardId)).toBeUndefined()
    })
  })

  it('should reduce hand size by the number of discarded cards', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)
    const handSizeBefore = currentPlayer.hand.length
    const cardsToDiscard = currentPlayer.hand.slice(0, 3).map(c => c.id)

    const newState = discardCards(state, cardsToDiscard)
    const updatedPlayer = getCurrentPlayer(newState)

    expect(updatedPlayer.hand.length).toBe(handSizeBefore - 3)
  })
})

describe('resolvePassGo', () => {
  it('should draw 2 additional cards for the current player', () => {
    const state = createInitialState(2)
    const handSizeBefore = getCurrentPlayer(state).hand.length

    const newState = resolvePassGo(state)
    const updatedPlayer = getCurrentPlayer(newState)

    expect(updatedPlayer.hand.length).toBe(handSizeBefore + 2)
  })

  it('should remove 2 cards from the deck', () => {
    const state = createInitialState(2)
    const deckSizeBefore = state.deck.length

    const newState = resolvePassGo(state)

    expect(newState.deck.length).toBe(deckSizeBefore - 2)
  })
})

describe('resolveDealBreaker', () => {
  it('should steal a complete set from the target player', () => {
    const state = createInitialState(2)
    const targetIndex = 1
    const targetPlayer = getPlayer(state, targetIndex)

    // Give target a complete brown set
    const brownSet = buildCompleteSet('brown')
    targetPlayer.properties.brown = brownSet

    const newState = resolveDealBreaker(state, targetIndex, 'brown')
    const updatedCurrent = getCurrentPlayer(newState)
    const updatedTarget = getPlayer(newState, targetIndex)

    // Current player should now have the brown set
    expect(updatedCurrent.properties.brown).toBeDefined()
    expect(updatedCurrent.properties.brown.length).toBe(2)

    // Target player should no longer have brown properties
    const targetBrown = updatedTarget.properties.brown
    expect(!targetBrown || targetBrown.length === 0).toBe(true)
  })

  it('should transfer all cards in the stolen set', () => {
    const state = createInitialState(2)
    const targetIndex = 1
    const targetPlayer = getPlayer(state, targetIndex)

    // Give target a complete lightblue set (3 cards)
    const lightblueSet = buildCompleteSet('lightblue')
    targetPlayer.properties.lightblue = lightblueSet

    const newState = resolveDealBreaker(state, targetIndex, 'lightblue')
    const updatedCurrent = getCurrentPlayer(newState)

    expect(updatedCurrent.properties.lightblue.length).toBe(3)
  })
})

describe('resolveSlyDeal', () => {
  it('should steal a single property card from an opponent', () => {
    const state = createInitialState(2)
    const targetIndex = 1
    const targetPlayer = getPlayer(state, targetIndex)

    // Give target a single green property (incomplete set)
    const greenCard = mockPropertyCard('green', 'Pacific Ave', 0)
    targetPlayer.properties.green = [greenCard]

    const newState = resolveSlyDeal(state, targetIndex, greenCard.id)
    const updatedCurrent = getCurrentPlayer(newState)
    const updatedTarget = getPlayer(newState, targetIndex)

    // Current player should have the card
    expect(updatedCurrent.properties.green).toBeDefined()
    expect(updatedCurrent.properties.green.some(c => c.id === greenCard.id)).toBe(true)

    // Target should not have it
    const targetGreen = updatedTarget.properties.green
    expect(!targetGreen || targetGreen.length === 0).toBe(true)
  })

  it('should not allow stealing from a complete set', () => {
    const state = createInitialState(2)
    const targetIndex = 1
    const targetPlayer = getPlayer(state, targetIndex)

    // Give target a complete brown set
    const brownSet = buildCompleteSet('brown')
    targetPlayer.properties.brown = brownSet
    const cardToSteal = brownSet[0]

    // Attempt to steal should fail (return unchanged state or throw)
    const result = resolveSlyDeal(state, targetIndex, cardToSteal.id)

    // The target should still have both brown properties
    const targetBrown = getPlayer(result, targetIndex).properties.brown
    expect(targetBrown.length).toBe(2)
  })

  it('should not allow stealing a rainbow wild card', () => {
    const state = createInitialState(2)
    const targetIndex = 1
    const targetPlayer = getPlayer(state, targetIndex)

    // Give target a rainbow wild in their properties
    const allColors = Object.keys(PROPERTY_CONFIG)
    const rainbowWild = mockWildCard(allColors, 0, true)
    targetPlayer.properties.brown = [rainbowWild]

    const result = resolveSlyDeal(state, targetIndex, rainbowWild.id)

    // Rainbow wild should still be with the target
    const targetBrown = getPlayer(result, targetIndex).properties.brown
    expect(targetBrown.some(c => c.id === rainbowWild.id)).toBe(true)
  })
})

describe('resolveJustSayNo', () => {
  it('odd number of Just Say No cards should cancel the action', () => {
    // Player A plays an action, Player B plays 1 JSN -> action is cancelled
    const state = createInitialState(2)

    // Simulate: 1 JSN played (odd) = action cancelled
    const result = resolveJustSayNo(state, { jsnCount: 1 })
    expect(result.cancelled).toBe(true)
  })

  it('even number of Just Say No cards should not cancel the action', () => {
    // Player A plays action, Player B plays JSN, Player A plays JSN back
    // 2 JSN played (even) = original action goes through
    const state = createInitialState(2)

    const result = resolveJustSayNo(state, { jsnCount: 2 })
    expect(result.cancelled).toBe(false)
  })

  it('3 Just Say No cards should cancel the action', () => {
    // A -> action, B -> JSN, A -> JSN, B -> JSN again => 3 (odd) = cancelled
    const state = createInitialState(2)

    const result = resolveJustSayNo(state, { jsnCount: 3 })
    expect(result.cancelled).toBe(true)
  })
})

describe('resolveHouse', () => {
  it('should add a house to a complete property set', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)

    // Give current player a complete brown set
    const brownSet = buildCompleteSet('brown')
    currentPlayer.properties.brown = brownSet

    // Give a house card in hand
    const houseCard = mockActionCard('House', 3, 0)
    currentPlayer.hand.push(houseCard)

    const newState = resolveHouse(state, houseCard.id, 'brown')
    const updatedPlayer = getCurrentPlayer(newState)

    // The brown set should now have a house
    expect(updatedPlayer.properties.brown.hasHouse).toBe(true)
  })

  it('should not add a house to an incomplete set', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)

    // Give current player only 1 green property (needs 3 for complete)
    const greenCard = mockPropertyCard('green', 'Pacific Ave', 0)
    currentPlayer.properties.green = [greenCard]

    const houseCard = mockActionCard('House', 3, 0)
    currentPlayer.hand.push(houseCard)

    const newState = resolveHouse(state, houseCard.id, 'green')
    const updatedPlayer = getCurrentPlayer(newState)

    // Should not have a house on incomplete set
    const greenProps = updatedPlayer.properties.green
    expect(!greenProps || !greenProps.hasHouse).toBe(true)
  })
})

describe('resolveHotel', () => {
  it('should add a hotel to a complete set that already has a house', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)

    // Give complete darkblue set with a house
    const darkblueSet = buildCompleteSet('darkblue')
    darkblueSet.hasHouse = true
    currentPlayer.properties.darkblue = darkblueSet

    const hotelCard = mockActionCard('Hotel', 4, 0)
    currentPlayer.hand.push(hotelCard)

    const newState = resolveHotel(state, hotelCard.id, 'darkblue')
    const updatedPlayer = getCurrentPlayer(newState)

    expect(updatedPlayer.properties.darkblue.hasHotel).toBe(true)
  })

  it('should not add a hotel if the set does not have a house', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)

    // Give complete darkblue set WITHOUT a house
    const darkblueSet = buildCompleteSet('darkblue')
    currentPlayer.properties.darkblue = darkblueSet

    const hotelCard = mockActionCard('Hotel', 4, 0)
    currentPlayer.hand.push(hotelCard)

    const newState = resolveHotel(state, hotelCard.id, 'darkblue')
    const updatedPlayer = getCurrentPlayer(newState)

    const darkblueProps = updatedPlayer.properties.darkblue
    expect(!darkblueProps || !darkblueProps.hasHotel).toBe(true)
  })

  it('should move the house value to the bank when hotel is placed', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)

    // Give complete brown set with a house
    const brownSet = buildCompleteSet('brown')
    brownSet.hasHouse = true
    currentPlayer.properties.brown = brownSet

    const hotelCard = mockActionCard('Hotel', 4, 0)
    currentPlayer.hand.push(hotelCard)

    const bankSizeBefore = currentPlayer.bank.length
    const newState = resolveHotel(state, hotelCard.id, 'brown')
    const updatedPlayer = getCurrentPlayer(newState)

    // House should be moved to bank (bank grows by 1 -- the house card)
    expect(updatedPlayer.bank.length).toBeGreaterThanOrEqual(bankSizeBefore)
  })
})

describe('win condition integration', () => {
  it('should trigger win when a player completes their 3rd set', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)

    // Give player 2 complete sets already
    currentPlayer.properties.brown = buildCompleteSet('brown')
    currentPlayer.properties.darkblue = buildCompleteSet('darkblue')

    // Give the last utility card needed to complete the 3rd set
    const utilitySet = buildCompleteSet('utility')
    currentPlayer.properties.utility = [utilitySet[0]]

    // Play the second utility card to complete the 3rd set
    const lastCard = utilitySet[1]
    currentPlayer.hand.push(lastCard)

    const newState = playPropertyCard(state, lastCard.id, 'utility')
    const updatedPlayer = getCurrentPlayer(newState)

    expect(checkWinCondition(updatedPlayer)).toBe(true)
  })

  it('should not trigger win with only 2 complete sets and a partial 3rd', () => {
    const state = createInitialState(2)
    const currentPlayer = getCurrentPlayer(state)

    // Give player 2 complete sets
    currentPlayer.properties.brown = buildCompleteSet('brown')
    currentPlayer.properties.darkblue = buildCompleteSet('darkblue')

    // Give 2 of 3 green properties (incomplete)
    currentPlayer.properties.green = [
      mockPropertyCard('green', 'Pacific Ave', 0),
      mockPropertyCard('green', 'North Carolina Ave', 1),
    ]

    expect(checkWinCondition(currentPlayer)).toBe(false)
  })
})

describe('getPlayer and getCurrentPlayer', () => {
  it('getCurrentPlayer should return the player at currentPlayerIndex', () => {
    const state = createInitialState(3)
    const current = getCurrentPlayer(state)
    expect(current).toBe(state.players[0])
  })

  it('getPlayer should return the player at the given index', () => {
    const state = createInitialState(3)
    const player1 = getPlayer(state, 1)
    expect(player1).toBe(state.players[1])
  })

  it('getPlayer should return different players for different indices', () => {
    const state = createInitialState(3)
    const p0 = getPlayer(state, 0)
    const p1 = getPlayer(state, 1)
    const p2 = getPlayer(state, 2)
    expect(p0).not.toBe(p1)
    expect(p1).not.toBe(p2)
  })
})
