import { PROPERTY_CONFIG } from './cards.js'
import { drawCards, bankCard, playPropertyCard, endTurn } from './gameState.js'

/**
 * Determine the best action for the current bot player.
 * Returns an action object: { type, cardId?, color? }
 */
export function decideBotAction(state) {
  const player = state.players[state.currentPlayerIndex]
  const hand = player.hand

  if (state.turnPhase === 'draw') {
    return { type: 'draw' }
  }

  if (state.playsRemaining <= 0) {
    return { type: 'endTurn' }
  }

  // 1. Play property cards to build sets
  const propertyCards = hand.filter(c => c.type === 'property')
  if (propertyCards.length > 0) {
    const bestProp = pickBestProperty(player, propertyCards)
    if (bestProp) {
      return { type: 'playProperty', cardId: bestProp.id, color: bestProp.color }
    }
  }

  // 2. Play wild cards on the color closest to completion
  const wildCards = hand.filter(c => c.type === 'wild')
  if (wildCards.length > 0) {
    const bestWild = pickBestWild(player, wildCards)
    if (bestWild) {
      return { type: 'playProperty', cardId: bestWild.card.id, color: bestWild.color }
    }
  }

  // 3. Bank money cards (highest value first)
  const moneyCards = hand.filter(c => c.type === 'money').sort((a, b) => b.value - a.value)
  if (moneyCards.length > 0) {
    return { type: 'bank', cardId: moneyCards[0].id }
  }

  // 4. Bank rent cards as money
  const rentCards = hand.filter(c => c.type === 'rent')
  if (rentCards.length > 0) {
    return { type: 'bank', cardId: rentCards[0].id }
  }

  // 5. Bank action cards as money (lowest value first)
  const actionCards = hand.filter(c => c.type === 'action').sort((a, b) => a.value - b.value)
  if (actionCards.length > 0) {
    return { type: 'bank', cardId: actionCards[0].id }
  }

  return { type: 'endTurn' }
}

function pickBestProperty(player, propertyCards) {
  let bestCard = null
  let bestScore = -1

  for (const card of propertyCards) {
    const color = card.color
    const config = PROPERTY_CONFIG[color]
    if (!config) continue
    const currentCount = (player.properties[color] || []).length
    const remaining = config.setSize - currentCount
    const score = config.setSize - remaining + 1
    if (score > bestScore) {
      bestScore = score
      bestCard = card
    }
  }

  return bestCard
}

function pickBestWild(player, wildCards) {
  for (const card of wildCards) {
    const possibleColors = card.isRainbowWild
      ? Object.keys(PROPERTY_CONFIG)
      : (card.colors || [])

    let bestColor = null
    let bestScore = -1

    for (const color of possibleColors) {
      const config = PROPERTY_CONFIG[color]
      if (!config) continue
      const currentCount = (player.properties[color] || []).length
      if (currentCount >= config.setSize) continue
      const score = currentCount
      if (score > bestScore) {
        bestScore = score
        bestColor = color
      }
    }

    if (bestColor) {
      return { card, color: bestColor }
    }
  }

  return null
}

/**
 * Apply a single bot action to the game state.
 */
export function applyBotAction(state, action) {
  switch (action.type) {
    case 'draw':
      return drawCards(state)
    case 'bank':
      return bankCard(state, action.cardId)
    case 'playProperty':
      return playPropertyCard(state, action.cardId, action.color)
    case 'endTurn':
      return endTurn(state)
    default:
      return state
  }
}

/**
 * Execute a full bot turn: draw, make plays, end turn.
 * Returns the final state after the bot's turn.
 */
export function executeBotTurn(state) {
  let current = state
  const startingPlayerIndex = current.currentPlayerIndex

  for (let i = 0; i < 10; i++) {
    const action = decideBotAction(current)
    current = applyBotAction(current, action)

    if (action.type === 'endTurn') break
    if (current.currentPlayerIndex !== startingPlayerIndex) break
  }

  return current
}
