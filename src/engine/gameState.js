import { createDeck } from './deck.js'
import { isSetComplete } from './properties.js'

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Create initial game state.
 * @param {number} numPlayers - Number of players (2-5)
 * @returns {object} Initial game state
 */
export function createInitialState(numPlayers) {
  let deck = createDeck()
  const players = []

  for (let i = 0; i < numPlayers; i++) {
    const hand = deck.slice(0, 5)
    deck = deck.slice(5)
    players.push({
      id: `player-${i}`,
      name: `Player ${i + 1}`,
      hand,
      bank: [],
      properties: {},
    })
  }

  return {
    id: generateId(),
    phase: 'playing',
    players,
    deck,
    discard: [],
    currentPlayerIndex: 0,
    playsRemaining: 3,
    turnPhase: 'draw',
    winner: null,
  }
}

/**
 * Get the current player (direct reference).
 */
export function getCurrentPlayer(state) {
  return state.players[state.currentPlayerIndex]
}

/**
 * Get a player by index (direct reference).
 */
export function getPlayer(state, index) {
  return state.players[index]
}

/**
 * Draw 2 cards for the current player.
 */
export function drawCards(state) {
  const playerIndex = state.currentPlayerIndex

  let deck = [...state.deck]
  let discard = [...state.discard]

  // If deck is empty, shuffle discard into deck
  if (deck.length === 0) {
    deck = [...discard].sort(() => Math.random() - 0.5)
    discard = []
  }

  const count = Math.min(2, deck.length)
  const drawn = deck.slice(0, count)
  deck = deck.slice(count)

  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex
      ? { ...p, hand: [...p.hand, ...drawn] }
      : p
  )

  return {
    ...state,
    deck,
    discard,
    players: updatedPlayers,
    turnPhase: 'play',
  }
}

/**
 * Move a card from the current player's hand to their bank.
 */
export function bankCard(state, cardId) {
  const playerIndex = state.currentPlayerIndex
  const player = state.players[playerIndex]

  const card = player.hand.find(c => c.id === cardId)
  if (!card) return state

  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex
      ? {
          ...p,
          hand: p.hand.filter(c => c.id !== cardId),
          bank: [...p.bank, card],
        }
      : p
  )

  return {
    ...state,
    players: updatedPlayers,
    playsRemaining: state.playsRemaining - 1,
  }
}

/**
 * Play a property card from the current player's hand to their property area.
 */
export function playPropertyCard(state, cardId, color) {
  const playerIndex = state.currentPlayerIndex
  const player = state.players[playerIndex]

  const card = player.hand.find(c => c.id === cardId)
  if (!card) return state

  const targetColor = color || card.color

  const updatedPlayers = state.players.map((p, i) => {
    if (i !== playerIndex) return p
    const existingCards = p.properties[targetColor] || []
    const newColorArray = [...existingCards, { ...card, color: targetColor }]
    // Preserve hasHouse/hasHotel flags if they existed
    if (existingCards.hasHouse) newColorArray.hasHouse = true
    if (existingCards.hasHotel) newColorArray.hasHotel = true
    return {
      ...p,
      hand: p.hand.filter(c => c.id !== cardId),
      properties: {
        ...p.properties,
        [targetColor]: newColorArray,
      },
    }
  })

  return {
    ...state,
    players: updatedPlayers,
    playsRemaining: state.playsRemaining - 1,
  }
}

/**
 * End the current player's turn and advance to the next player.
 */
export function endTurn(state) {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    playsRemaining: 3,
    turnPhase: 'draw',
  }
}

/**
 * Discard specified cards from the current player's hand.
 */
export function discardCards(state, cardIds) {
  const playerIndex = state.currentPlayerIndex
  const player = state.players[playerIndex]

  const discarded = player.hand.filter(c => cardIds.includes(c.id))

  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex
      ? { ...p, hand: p.hand.filter(c => !cardIds.includes(c.id)) }
      : p
  )

  return {
    ...state,
    players: updatedPlayers,
    discard: [...state.discard, ...discarded],
  }
}

/**
 * Resolve Pass Go: draw 2 additional cards for the current player.
 */
export function resolvePassGo(state) {
  return drawCards(state)
}

/**
 * Resolve Deal Breaker: steal a complete set from a target player.
 * @param {object} state
 * @param {number} targetIndex - Index of the target player
 * @param {string} color - Color of the set to steal
 */
export function resolveDealBreaker(state, targetIndex, color) {
  const target = state.players[targetIndex]
  if (!target) return state
  if (!isSetComplete(target.properties, color)) return state

  const stolenCards = [...(target.properties[color] || [])]
  const playerIndex = state.currentPlayerIndex

  const updatedPlayers = state.players.map((p, i) => {
    if (i === targetIndex) {
      const newProps = { ...p.properties }
      delete newProps[color]
      return { ...p, properties: newProps }
    }
    if (i === playerIndex) {
      const existingCards = p.properties[color] || []
      return {
        ...p,
        properties: {
          ...p.properties,
          [color]: [...existingCards, ...stolenCards],
        },
      }
    }
    return p
  })

  return {
    ...state,
    players: updatedPlayers,
  }
}

/**
 * Resolve Sly Deal: steal a single property card from a target player.
 * Cannot steal from a complete set or steal a rainbow wild.
 * @param {object} state
 * @param {number} targetIndex - Index of the target player
 * @param {string} cardId - ID of the card to steal
 */
export function resolveSlyDeal(state, targetIndex, cardId) {
  const target = state.players[targetIndex]
  if (!target) return state

  const playerIndex = state.currentPlayerIndex

  // Find the card in target's properties
  let foundColor = null
  let foundCard = null
  for (const [color, cards] of Object.entries(target.properties)) {
    const card = cards.find(c => c.id === cardId)
    if (card) {
      // Cannot steal from a complete set
      if (isSetComplete(target.properties, color)) return state
      // Cannot steal rainbow wild
      if (card.isRainbowWild) return state
      foundColor = color
      foundCard = card
      break
    }
  }
  if (!foundCard) return state

  const updatedPlayers = state.players.map((p, i) => {
    if (i === targetIndex) {
      return {
        ...p,
        properties: {
          ...p.properties,
          [foundColor]: p.properties[foundColor].filter(c => c.id !== cardId),
        },
      }
    }
    if (i === playerIndex) {
      const existingCards = p.properties[foundColor] || []
      return {
        ...p,
        properties: {
          ...p.properties,
          [foundColor]: [...existingCards, foundCard],
        },
      }
    }
    return p
  })

  return {
    ...state,
    players: updatedPlayers,
  }
}

/**
 * Resolve Just Say No chain.
 * @param {object} state
 * @param {{ jsnCount: number }} options
 * @returns {{ state: object, cancelled: boolean }}
 */
export function resolveJustSayNo(state, { jsnCount }) {
  const cancelled = jsnCount % 2 === 1
  return { state, cancelled }
}

/**
 * Resolve House: add a house to a complete property set.
 * Sets hasHouse flag on the property array.
 * @param {object} state
 * @param {string} cardId - ID of the house card in hand
 * @param {string} color - Color of the set to add the house to
 */
export function resolveHouse(state, cardId, color) {
  const playerIndex = state.currentPlayerIndex
  const player = state.players[playerIndex]

  if (!isSetComplete(player.properties, color)) return state

  const card = player.hand.find(c => c.id === cardId)
  if (!card) return state

  const updatedPlayers = state.players.map((p, i) => {
    if (i !== playerIndex) return p
    const newColorArray = [...p.properties[color]]
    newColorArray.hasHouse = true
    // Preserve hasHotel if it existed
    if (p.properties[color].hasHotel) newColorArray.hasHotel = true
    return {
      ...p,
      hand: p.hand.filter(c => c.id !== cardId),
      properties: {
        ...p.properties,
        [color]: newColorArray,
      },
    }
  })

  return {
    ...state,
    players: updatedPlayers,
    playsRemaining: state.playsRemaining - 1,
  }
}

/**
 * Resolve Hotel: add a hotel to a complete property set that has a house.
 * Sets hasHotel flag, removes hasHouse flag, moves house value ($3) to bank.
 * @param {object} state
 * @param {string} cardId - ID of the hotel card in hand
 * @param {string} color - Color of the set to add the hotel to
 */
export function resolveHotel(state, cardId, color) {
  const playerIndex = state.currentPlayerIndex
  const player = state.players[playerIndex]

  if (!isSetComplete(player.properties, color)) return state
  if (!player.properties[color]?.hasHouse) return state

  const card = player.hand.find(c => c.id === cardId)
  if (!card) return state

  const updatedPlayers = state.players.map((p, i) => {
    if (i !== playerIndex) return p
    const newColorArray = [...p.properties[color]]
    newColorArray.hasHotel = true
    newColorArray.hasHouse = false
    // Add the house value ($3) to bank as a money card
    const houseMoneyCard = {
      id: `house-to-bank-${generateId()}`,
      type: 'money',
      name: '$3M',
      value: 3,
    }
    return {
      ...p,
      hand: p.hand.filter(c => c.id !== cardId),
      bank: [...p.bank, houseMoneyCard],
      properties: {
        ...p.properties,
        [color]: newColorArray,
      },
    }
  })

  return {
    ...state,
    players: updatedPlayers,
    playsRemaining: state.playsRemaining - 1,
  }
}
