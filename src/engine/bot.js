import { PROPERTY_CONFIG } from './cards.js'
import { isSetComplete } from './properties.js'
import { calculateRent } from './rent.js'
import {
  drawCards, bankCard, playPropertyCard, endTurn,
  playActionCard, resolveDealBreaker, resolveSlyDeal, resolveForcedDeal,
  resolveRent, resolveDebtCollector, resolveBirthday, resolvePayDebt,
  resolveHouse, resolveHotel,
} from './gameState.js'

/**
 * Auto-resolve a single pending payment by picking cheapest cards first.
 */
function autoPayDebt(state, payment) {
  const payer = state.players[payment.fromIndex]
  if (!payer) return state

  const allPayable = [
    ...payer.bank.map(c => c.id),
    ...Object.values(payer.properties).flat().map(c => c.id),
  ]

  if (allPayable.length === 0) return state

  const cardValueMap = {}
  for (const c of payer.bank) cardValueMap[c.id] = c.value || 0
  for (const cards of Object.values(payer.properties)) {
    for (const c of cards) cardValueMap[c.id] = c.value || 0
  }

  allPayable.sort((a, b) => cardValueMap[a] - cardValueMap[b])

  const selected = []
  let total = 0
  for (const id of allPayable) {
    selected.push(id)
    total += cardValueMap[id]
    if (total >= payment.amount) break
  }

  return resolvePayDebt(state, payment.fromIndex, payment.toIndex, selected)
}

/**
 * Get total payable assets for a player.
 */
function getPayableTotal(player) {
  const bankTotal = player.bank.reduce((s, c) => s + (c.value || 0), 0)
  const propTotal = Object.values(player.properties).flat().reduce((s, c) => s + (c.value || 0), 0)
  return bankTotal + propTotal
}

/**
 * Determine the best action for the current bot player.
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

  // 1. Play Deal Breaker if any opponent has a complete set
  const dealBreakers = hand.filter(c => c.type === 'action' && c.name === 'Deal Breaker')
  if (dealBreakers.length > 0) {
    for (let i = 0; i < state.players.length; i++) {
      if (i === state.currentPlayerIndex) continue
      const opp = state.players[i]
      for (const color of Object.keys(opp.properties)) {
        if (isSetComplete(opp.properties, color)) {
          return { type: 'playDealBreaker', cardId: dealBreakers[0].id, targetIndex: i, color }
        }
      }
    }
  }

  // 2. Play Rent cards (choose color with highest rent value)
  const rentCards = hand.filter(c => c.type === 'rent')
  for (const rc of rentCards) {
    const applicableColors = (rc.rentColors || []).filter(color =>
      player.properties[color] && player.properties[color].length > 0
    )
    if (applicableColors.length > 0) {
      let bestColor = applicableColors[0]
      let bestRent = 0
      for (const color of applicableColors) {
        const rent = calculateRent(player, color)
        if (rent > bestRent) {
          bestRent = rent
          bestColor = color
        }
      }
      if (bestRent > 0) {
        let targetIndex = -1
        if (!rc.targetsAll) {
          let bestAssets = -1
          for (let i = 0; i < state.players.length; i++) {
            if (i === state.currentPlayerIndex) continue
            const assets = getPayableTotal(state.players[i])
            if (assets > bestAssets) { bestAssets = assets; targetIndex = i }
          }
        }
        return { type: 'playRent', cardId: rc.id, color: bestColor, targetsAll: rc.targetsAll, targetIndex }
      }
    }
  }

  // 3. Play Birthday
  const birthdays = hand.filter(c => c.type === 'action' && c.name?.toLowerCase().includes('birthday'))
  if (birthdays.length > 0) {
    return { type: 'playBirthday', cardId: birthdays[0].id }
  }

  // 4. Play Debt Collector (target richest opponent)
  const debtCollectors = hand.filter(c => c.type === 'action' && c.name === 'Debt Collector')
  if (debtCollectors.length > 0) {
    let bestTarget = -1, bestAssets = 0
    for (let i = 0; i < state.players.length; i++) {
      if (i === state.currentPlayerIndex) continue
      const assets = getPayableTotal(state.players[i])
      if (assets > bestAssets) { bestAssets = assets; bestTarget = i }
    }
    if (bestTarget >= 0 && bestAssets > 0) {
      return { type: 'playDebtCollector', cardId: debtCollectors[0].id, targetIndex: bestTarget }
    }
  }

  // 5. Play Sly Deal (steal a property from incomplete set)
  const slyDeals = hand.filter(c => c.type === 'action' && c.name === 'Sly Deal')
  if (slyDeals.length > 0) {
    let bestSteal = null
    for (let i = 0; i < state.players.length; i++) {
      if (i === state.currentPlayerIndex) continue
      const opp = state.players[i]
      for (const [color, cards] of Object.entries(opp.properties)) {
        if (isSetComplete(opp.properties, color)) continue
        for (const card of cards) {
          if (card.isRainbowWild) continue
          if (!bestSteal || (card.value || 0) > (bestSteal.value || 0)) {
            bestSteal = { targetIndex: i, cardId: card.id, value: card.value || 0 }
          }
        }
      }
    }
    if (bestSteal) {
      return { type: 'playSlyDeal', cardId: slyDeals[0].id, targetIndex: bestSteal.targetIndex, stealCardId: bestSteal.cardId }
    }
  }

  // 6. Play Forced Deal (swap worst property for best)
  const forcedDeals = hand.filter(c => c.type === 'action' && c.name === 'Forced Deal')
  if (forcedDeals.length > 0) {
    let myWorst = null
    for (const [color, cards] of Object.entries(player.properties)) {
      if (isSetComplete(player.properties, color)) continue
      for (const card of cards) {
        if (!myWorst || (card.value || 0) < myWorst.value) {
          myWorst = { id: card.id, value: card.value || 0 }
        }
      }
    }
    if (myWorst) {
      let bestOppCard = null
      for (let i = 0; i < state.players.length; i++) {
        if (i === state.currentPlayerIndex) continue
        const opp = state.players[i]
        for (const [color, cards] of Object.entries(opp.properties)) {
          if (isSetComplete(opp.properties, color)) continue
          for (const card of cards) {
            if (!bestOppCard || (card.value || 0) > bestOppCard.value) {
              bestOppCard = { targetIndex: i, id: card.id, value: card.value || 0 }
            }
          }
        }
      }
      if (bestOppCard && bestOppCard.value > myWorst.value) {
        return {
          type: 'playForcedDeal',
          cardId: forcedDeals[0].id,
          targetIndex: bestOppCard.targetIndex,
          yourCardId: myWorst.id,
          theirCardId: bestOppCard.id,
        }
      }
    }
  }

  // 7. Play House on complete sets
  const houses = hand.filter(c => c.type === 'action' && c.name === 'House')
  if (houses.length > 0) {
    for (const color of Object.keys(player.properties)) {
      if (color === 'railroad' || color === 'utility') continue
      if (isSetComplete(player.properties, color) && !player.houses?.[color]) {
        return { type: 'playHouse', cardId: houses[0].id, color }
      }
    }
  }

  // 8. Play Hotel on sets with houses
  const hotels = hand.filter(c => c.type === 'action' && c.name === 'Hotel')
  if (hotels.length > 0) {
    for (const color of Object.keys(player.properties)) {
      if (color === 'railroad' || color === 'utility') continue
      if (isSetComplete(player.properties, color) && player.houses?.[color] && !player.hotels?.[color]) {
        return { type: 'playHotel', cardId: hotels[0].id, color }
      }
    }
  }

  // 9. Play property cards
  const propertyCards = hand.filter(c => c.type === 'property')
  if (propertyCards.length > 0) {
    const bestProp = pickBestProperty(player, propertyCards)
    if (bestProp) {
      return { type: 'playProperty', cardId: bestProp.id, color: bestProp.color }
    }
  }

  // 10. Play wild cards
  const wildCards = hand.filter(c => c.type === 'wild')
  if (wildCards.length > 0) {
    const bestWild = pickBestWild(player, wildCards)
    if (bestWild) {
      return { type: 'playProperty', cardId: bestWild.card.id, color: bestWild.color }
    }
  }

  // 11. Bank money (highest value first)
  const moneyCards = hand.filter(c => c.type === 'money').sort((a, b) => b.value - a.value)
  if (moneyCards.length > 0) {
    return { type: 'bank', cardId: moneyCards[0].id }
  }

  // 12. Bank action cards (NOT Just Say No — keep for defense)
  const bankableActions = hand.filter(c =>
    c.type === 'action' &&
    c.name?.toLowerCase() !== 'just say no'
  ).sort((a, b) => a.value - b.value)
  if (bankableActions.length > 0) {
    return { type: 'bank', cardId: bankableActions[0].id }
  }

  // 13. Bank rent cards
  const bankableRent = hand.filter(c => c.type === 'rent')
  if (bankableRent.length > 0) {
    return { type: 'bank', cardId: bankableRent[0].id }
  }

  // 14. Bank JSN last resort
  const jsnCards = hand.filter(c => c.name?.toLowerCase() === 'just say no')
  if (jsnCards.length > 0) {
    return { type: 'bank', cardId: jsnCards[0].id }
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
    case 'playDealBreaker': {
      const afterPlay = playActionCard(state, action.cardId)
      return resolveDealBreaker(afterPlay, action.targetIndex, action.color)
    }
    case 'playRent': {
      const afterPlay = playActionCard(state, action.cardId)
      const targets = action.targetsAll
        ? afterPlay.players.map((_, i) => i).filter(i => i !== afterPlay.currentPlayerIndex)
        : [action.targetIndex]
      const { pendingPayments } = resolveRent(afterPlay, action.color, targets, false)
      let current = afterPlay
      for (const payment of pendingPayments) {
        current = autoPayDebt(current, payment)
      }
      return current
    }
    case 'playBirthday': {
      const afterPlay = playActionCard(state, action.cardId)
      const { pendingPayments } = resolveBirthday(afterPlay)
      let current = afterPlay
      for (const payment of pendingPayments) {
        current = autoPayDebt(current, payment)
      }
      return current
    }
    case 'playDebtCollector': {
      const afterPlay = playActionCard(state, action.cardId)
      const { pendingPayment } = resolveDebtCollector(afterPlay, action.targetIndex)
      return autoPayDebt(afterPlay, pendingPayment)
    }
    case 'playSlyDeal': {
      const afterPlay = playActionCard(state, action.cardId)
      return resolveSlyDeal(afterPlay, action.targetIndex, action.stealCardId)
    }
    case 'playForcedDeal': {
      const afterPlay = playActionCard(state, action.cardId)
      return resolveForcedDeal(afterPlay, action.targetIndex, action.yourCardId, action.theirCardId)
    }
    case 'playHouse':
      return resolveHouse(state, action.cardId, action.color)
    case 'playHotel':
      return resolveHotel(state, action.cardId, action.color)
    case 'endTurn':
      return endTurn(state)
    default:
      return state
  }
}

/**
 * Execute a full bot turn: draw, make plays, end turn.
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
