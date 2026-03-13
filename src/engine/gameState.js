import { createDeck } from './deck.js'
import { isSetComplete } from './properties.js'
import { checkWinCondition } from './winCondition.js'
import { calculateRent } from './rent.js'

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

/** Check all players for win condition and set winner if found */
function applyWinCheck(state) {
  if (state.winner !== null && state.winner !== undefined) return state
  for (let i = 0; i < state.players.length; i++) {
    if (checkWinCondition(state.players[i])) {
      return { ...state, winner: i }
    }
  }
  return state
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

  return applyWinCheck({
    ...state,
    players: updatedPlayers,
    playsRemaining: state.playsRemaining - 1,
  })
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

  return applyWinCheck({ ...state, players: updatedPlayers })
}

/**
 * Resolve Sly Deal: steal a single property card from a target player.
 */
export function resolveSlyDeal(state, targetIndex, cardId) {
  const target = state.players[targetIndex]
  if (!target) return state

  const playerIndex = state.currentPlayerIndex

  let foundColor = null
  let foundCard = null
  for (const [color, cards] of Object.entries(target.properties)) {
    const card = cards.find(c => c.id === cardId)
    if (card) {
      if (isSetComplete(target.properties, color)) return state
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

  return applyWinCheck({ ...state, players: updatedPlayers })
}

/**
 * Resolve Just Say No chain.
 */
export function resolveJustSayNo(state, { jsnCount }) {
  const cancelled = jsnCount % 2 === 1
  return { state, cancelled }
}

/**
 * Resolve House: add a house to a complete property set.
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

  return { ...state, players: updatedPlayers, playsRemaining: state.playsRemaining - 1 }
}

/**
 * Resolve Hotel: add a hotel to a complete property set that has a house.
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

  return { ...state, players: updatedPlayers, playsRemaining: state.playsRemaining - 1 }
}

/**
 * Move a wild card between color groups during your turn (free action).
 */
export function moveWild(state, cardId, fromColor, toColor) {
  const playerIndex = state.currentPlayerIndex
  const player = state.players[playerIndex]

  const fromCards = player.properties[fromColor] || []
  const card = fromCards.find(c => c.id === cardId)
  if (!card || card.type !== 'wild') return state
  if (!card.isRainbowWild && !card.colors.includes(toColor)) return state

  const updatedPlayers = state.players.map((p, i) => {
    if (i !== playerIndex) return p
    const newFrom = p.properties[fromColor].filter(c => c.id !== cardId)
    const newTo = [...(p.properties[toColor] || []), { ...card, color: toColor }]
    if (p.properties[fromColor]?.hasHouse) newFrom.hasHouse = true
    if (p.properties[fromColor]?.hasHotel) newFrom.hasHotel = true
    if (p.properties[toColor]?.hasHouse) newTo.hasHouse = true
    if (p.properties[toColor]?.hasHotel) newTo.hasHotel = true
    return {
      ...p,
      properties: { ...p.properties, [fromColor]: newFrom, [toColor]: newTo },
    }
  })

  return applyWinCheck({ ...state, players: updatedPlayers })
}

/**
 * Remove a house from a property set and bank its value ($3M). Free action.
 */
export function removeHouse(state, color) {
  const playerIndex = state.currentPlayerIndex
  const player = state.players[playerIndex]
  const colorCards = player.properties[color]
  if (!colorCards?.hasHouse) return state

  const updatedPlayers = state.players.map((p, i) => {
    if (i !== playerIndex) return p
    const newColorArray = [...p.properties[color]]
    newColorArray.hasHouse = false
    if (p.properties[color].hasHotel) newColorArray.hasHotel = true
    const houseMoneyCard = {
      id: `house-banked-${generateId()}`,
      type: 'money',
      name: '$3M',
      value: 3,
    }
    return {
      ...p,
      bank: [...p.bank, houseMoneyCard],
      properties: { ...p.properties, [color]: newColorArray },
    }
  })

  return { ...state, players: updatedPlayers }
}

/**
 * Remove a hotel from a property set and bank its value ($4M). Free action.
 */
export function removeHotel(state, color) {
  const playerIndex = state.currentPlayerIndex
  const player = state.players[playerIndex]
  const colorCards = player.properties[color]
  if (!colorCards?.hasHotel) return state

  const updatedPlayers = state.players.map((p, i) => {
    if (i !== playerIndex) return p
    const newColorArray = [...p.properties[color]]
    newColorArray.hasHotel = false
    const hotelMoneyCard = {
      id: `hotel-banked-${generateId()}`,
      type: 'money',
      name: '$4M',
      value: 4,
    }
    return {
      ...p,
      bank: [...p.bank, hotelMoneyCard],
      properties: { ...p.properties, [color]: newColorArray },
    }
  })

  return { ...state, players: updatedPlayers }
}

/**
 * Play an action card from hand (removes from hand, adds to discard).
 */
export function playActionCard(state, cardId) {
  const playerIndex = state.currentPlayerIndex
  const player = state.players[playerIndex]
  const card = player.hand.find(c => c.id === cardId)
  if (!card) return state

  const updatedPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: p.hand.filter(c => c.id !== cardId) } : p
  )

  return {
    ...state,
    players: updatedPlayers,
    discard: [...state.discard, card],
    playsRemaining: state.playsRemaining - 1,
  }
}

/**
 * Resolve Debt Collector: one chosen player pays $5M.
 */
export function resolveDebtCollector(state, targetIndex) {
  return {
    state,
    pendingPayment: { fromIndex: targetIndex, toIndex: state.currentPlayerIndex, amount: 5 },
  }
}

/**
 * Resolve Birthday: all other players pay $2M.
 */
export function resolveBirthday(state) {
  const pendingPayments = state.players
    .map((_p, i) => i)
    .filter(i => i !== state.currentPlayerIndex)
    .map(i => ({ fromIndex: i, toIndex: state.currentPlayerIndex, amount: 2 }))
  return { state, pendingPayments }
}

/**
 * Resolve Rent: charge rent for a color to target player(s).
 */
export function resolveRent(state, color, targetIndices, doubled) {
  const player = state.players[state.currentPlayerIndex]
  let rent = calculateRent(player.properties, color)
  if (doubled) rent *= 2

  const pendingPayments = targetIndices.map(ti => ({
    fromIndex: ti,
    toIndex: state.currentPlayerIndex,
    amount: rent,
  }))

  return { state, pendingPayments }
}

/**
 * Resolve Forced Deal: swap one of your properties with one opponent property.
 */
export function resolveForcedDeal(state, targetIndex, yourCardId, theirCardId) {
  const playerIndex = state.currentPlayerIndex
  const actor = state.players[playerIndex]
  const target = state.players[targetIndex]
  if (!actor || !target) return state

  let yourColor = null, yourCard = null
  for (const [clr, cards] of Object.entries(actor.properties)) {
    const found = cards.find(c => c.id === yourCardId)
    if (found) { yourColor = clr; yourCard = found; break }
  }

  let theirColor = null, theirCard = null
  for (const [clr, cards] of Object.entries(target.properties)) {
    const found = cards.find(c => c.id === theirCardId)
    if (found) {
      if (isSetComplete(target.properties, clr)) return state
      theirColor = clr; theirCard = found; break
    }
  }

  if (!yourCard || !theirCard) return state

  const updatedPlayers = state.players.map((p, i) => {
    if (i === playerIndex) {
      return {
        ...p,
        properties: {
          ...p.properties,
          [yourColor]: p.properties[yourColor].filter(c => c.id !== yourCardId),
          [theirColor]: [...(p.properties[theirColor] || []), theirCard],
        },
      }
    }
    if (i === targetIndex) {
      return {
        ...p,
        properties: {
          ...p.properties,
          [theirColor]: p.properties[theirColor].filter(c => c.id !== theirCardId),
          [yourColor]: [...(p.properties[yourColor] || []), yourCard],
        },
      }
    }
    return p
  })

  return applyWinCheck({ ...state, players: updatedPlayers })
}

/**
 * Resolve paying a debt: move cards from payer to receiver.
 */
export function resolvePayDebt(state, payingIndex, receivingIndex, cardIds) {
  const payer = state.players[payingIndex]
  if (!payer) return state

  const bankCardIds = cardIds.filter(id => payer.bank.some(c => c.id === id))
  const propertyCardIds = cardIds.filter(id => {
    for (const cards of Object.values(payer.properties)) {
      if (cards.some(c => c.id === id)) return true
    }
    return false
  })

  const bankCards = payer.bank.filter(c => bankCardIds.includes(c.id))
  const propertyCards = []
  const propertyRemovals = {}

  for (const id of propertyCardIds) {
    for (const [clr, cards] of Object.entries(payer.properties)) {
      const card = cards.find(c => c.id === id)
      if (card) {
        propertyCards.push(card)
        if (!propertyRemovals[clr]) propertyRemovals[clr] = []
        propertyRemovals[clr].push(id)
        break
      }
    }
  }

  const updatedPlayers = state.players.map((p, i) => {
    if (i === payingIndex) {
      const newProperties = { ...p.properties }
      for (const [clr, ids] of Object.entries(propertyRemovals)) {
        newProperties[clr] = newProperties[clr].filter(c => !ids.includes(c.id))
      }
      return { ...p, bank: p.bank.filter(c => !bankCardIds.includes(c.id)), properties: newProperties }
    }
    if (i === receivingIndex) {
      const newProperties = { ...p.properties }
      for (const card of propertyCards) {
        const clr = card.color || 'brown'
        newProperties[clr] = [...(newProperties[clr] || []), card]
      }
      return { ...p, bank: [...p.bank, ...bankCards], properties: newProperties }
    }
    return p
  })

  return { ...state, players: updatedPlayers }
}
