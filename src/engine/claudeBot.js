import Anthropic from '@anthropic-ai/sdk'
import { PROPERTY_CONFIG } from './cards.js'
import { isSetComplete } from './properties.js'
import { calculateRent } from './rent.js'
import {
  drawCards, bankCard, playPropertyCard, endTurn,
  playActionCard, resolveDealBreaker, resolveSlyDeal, resolveForcedDeal,
  resolveRent, resolveDebtCollector, resolveBirthday, resolvePayDebt,
  resolveHouse, resolveHotel,
} from './gameState.js'

const client = new Anthropic()

/**
 * Serialize game state into a concise string for Claude.
 */
function serializeGameState(state) {
  const player = state.players[state.currentPlayerIndex]
  const opponents = state.players
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => p.index !== state.currentPlayerIndex)

  const handDesc = player.hand.map(c => {
    if (c.type === 'property') return `[PROP ${c.name} ${c.color} $${c.value}M id:${c.id}]`
    if (c.type === 'wild') return `[WILD ${c.name} colors:${(c.colors || []).join('/')} $${c.value}M id:${c.id}]`
    if (c.type === 'money') return `[MONEY ${c.name} id:${c.id}]`
    if (c.type === 'rent') return `[RENT ${c.name} colors:${(c.rentColors || []).join('/')} targetsAll:${c.targetsAll} id:${c.id}]`
    if (c.type === 'action') return `[ACTION ${c.name} $${c.value}M id:${c.id}]`
    return `[${c.type} ${c.name} id:${c.id}]`
  }).join(', ')

  const propsDesc = Object.entries(player.properties).map(([color, cards]) => {
    const complete = isSetComplete(player.properties, color) ? ' COMPLETE' : ''
    const needed = PROPERTY_CONFIG[color]?.setSize || 0
    const rent = calculateRent(player, color)
    return `${color}(${cards.length}/${needed}${complete} rent:$${rent}M): ${cards.map(c => c.name).join(', ')}`
  }).join('; ')

  const bankTotal = player.bank.reduce((s, c) => s + (c.value || 0), 0)

  const oppsDesc = opponents.map(opp => {
    const oppProps = Object.entries(opp.properties).map(([color, cards]) => {
      const complete = isSetComplete(opp.properties, color) ? ' COMPLETE' : ''
      const needed = PROPERTY_CONFIG[color]?.setSize || 0
      return `${color}(${cards.length}/${needed}${complete})`
    }).join(', ')
    const oppBank = opp.bank.reduce((s, c) => s + (c.value || 0), 0)
    const oppCompleteSets = Object.keys(opp.properties).filter(c => isSetComplete(opp.properties, c)).length
    return `P${opp.index}(${opp.name}): ${oppCompleteSets} complete sets, bank:$${oppBank}M, props:[${oppProps}], hand:${opp.hand.length} cards`
  }).join('\n')

  const completeSets = Object.keys(player.properties).filter(c => isSetComplete(player.properties, c)).length

  return `GAME STATE:
Turn phase: ${state.turnPhase}, Plays remaining: ${state.playsRemaining}
Deck: ${state.deck.length} cards, Discard: ${state.discard.length} cards

YOUR STATUS (Player ${state.currentPlayerIndex}):
Complete sets: ${completeSets}/3 needed to win
Hand: ${handDesc}
Properties: ${propsDesc || 'none'}
Bank: $${bankTotal}M (${player.bank.length} cards)
Houses: ${JSON.stringify(player.houses || {})}
Hotels: ${JSON.stringify(player.hotels || {})}

OPPONENTS:
${oppsDesc}`
}

/**
 * Ask Claude for a game action.
 */
export async function getClaudeAction(state) {
  const gameState = serializeGameState(state)
  const player = state.players[state.currentPlayerIndex]

  if (state.turnPhase === 'draw') {
    return { type: 'draw' }
  }

  if (state.playsRemaining <= 0) {
    return { type: 'endTurn' }
  }

  const prompt = `You are playing Monopoly Deal. Win by completing 3 property sets.

${gameState}

Choose ONE action. Respond with ONLY a JSON object, no other text.

Valid actions:
- {"type":"draw"} - draw cards (only during draw phase)
- {"type":"bank","cardId":"..."} - bank a card as money
- {"type":"playProperty","cardId":"...","color":"..."} - play property/wild card
- {"type":"playRent","cardId":"...","color":"...","targetsAll":true/false,"targetIndex":N} - play rent card
- {"type":"playBirthday","cardId":"..."} - play birthday card
- {"type":"playDebtCollector","cardId":"...","targetIndex":N} - play debt collector
- {"type":"playDealBreaker","cardId":"...","targetIndex":N,"color":"..."} - steal complete set
- {"type":"playSlyDeal","cardId":"...","targetIndex":N,"stealCardId":"..."} - steal one property
- {"type":"playForcedDeal","cardId":"...","targetIndex":N,"yourCardId":"...","theirCardId":"..."} - swap properties
- {"type":"playHouse","cardId":"...","color":"..."} - place house on complete set
- {"type":"playHotel","cardId":"...","color":"..."} - place hotel on complete set with house
- {"type":"endTurn"} - end your turn

Strategy tips:
- Build towards completing 3 sets
- Play high-rent cards to collect money
- Use action cards strategically
- Keep Just Say No for defense (don't bank it unless desperate)
- Steal complete sets with Deal Breaker when possible`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0]?.text?.trim()
    if (!text) return { type: 'endTurn' }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { type: 'endTurn' }

    const action = JSON.parse(jsonMatch[0])

    // Validate the action has a valid card reference
    if (action.cardId && !player.hand.find(c => c.id === action.cardId)) {
      return { type: 'endTurn' }
    }

    return action
  } catch {
    return { type: 'endTurn' }
  }
}

/**
 * Auto-resolve a single pending payment.
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
 * Apply a Claude bot action to the game state.
 */
export function applyClaudeAction(state, action) {
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
      return endTurn(state)
  }
}

/**
 * Execute a full Claude bot turn.
 */
export async function executeClaudeTurn(state) {
  let current = state
  const startIndex = current.currentPlayerIndex
  const actions = []

  for (let i = 0; i < 6; i++) {
    const action = await getClaudeAction(current)
    actions.push(action)

    try {
      current = applyClaudeAction(current, action)
    } catch {
      current = endTurn(current)
      break
    }

    if (action.type === 'endTurn') break
    if (current.currentPlayerIndex !== startIndex) break
    if (current.winner !== null && current.winner !== undefined) break
  }

  return { state: current, actions }
}
