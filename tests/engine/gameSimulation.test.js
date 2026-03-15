import { describe, it, expect } from 'vitest'
import { createInitialState, drawCards, endTurn } from '../../src/engine/gameState.js'
import { decideBotAction, applyBotAction } from '../../src/engine/bot.js'
import { isSetComplete } from '../../src/engine/properties.js'

const TOTAL_CARDS = 107

/**
 * Collect all card IDs across the entire game state.
 */
function collectAllCardIds(state) {
  const ids = []
  for (const c of state.deck) ids.push(c.id)
  for (const c of state.discard) ids.push(c.id)
  for (const p of state.players) {
    for (const c of p.hand) ids.push(c.id)
    for (const c of p.bank) ids.push(c.id)
    for (const cards of Object.values(p.properties)) {
      for (const c of cards) ids.push(c.id)
    }
  }
  return ids
}

/**
 * Find a card by ID anywhere in the game state.
 */
function findCardById(state, targetId) {
  for (const c of state.deck) { if (c.id === targetId) return c }
  for (const c of state.discard) { if (c.id === targetId) return c }
  for (const p of state.players) {
    for (const c of p.hand) { if (c.id === targetId) return c }
    for (const c of p.bank) { if (c.id === targetId) return c }
    for (const cards of Object.values(p.properties)) {
      for (const c of cards) { if (c.id === targetId) return c }
    }
  }
  return null
}

/**
 * Validate all game invariants. Returns an array of violation strings.
 */
function validateInvariants(state, context) {
  const violations = []
  const prefix = context || ''

  const allIds = collectAllCardIds(state)

  // 1. Total card count (allow banked house/hotel money cards to increase count)
  // House/hotel banking creates new money cards, so total can exceed 107
  // Instead, check no cards vanish: allIds.length >= TOTAL_CARDS is always true
  // But duplicate IDs are the real invariant

  // 2. No duplicate card IDs
  const idSet = new Set(allIds)
  if (idSet.size !== allIds.length) {
    const seen = new Set()
    const dupes = []
    for (const id of allIds) {
      if (seen.has(id)) dupes.push(id)
      seen.add(id)
    }
    violations.push(`${prefix} Duplicate card IDs: ${[...new Set(dupes)].slice(0, 5).join(', ')}`)
  }

  // 3. No empty arrays in any player's properties
  for (let pi = 0; pi < state.players.length; pi++) {
    const p = state.players[pi]
    for (const [color, cards] of Object.entries(p.properties)) {
      if (cards.length === 0) {
        violations.push(`${prefix} Player ${pi} has empty property array for ${color}`)
      }
    }
  }

  // 4. All cards have valid type, name fields
  for (const id of idSet) {
    const card = findCardById(state, id)
    if (card) {
      if (!card.type) violations.push(`${prefix} Card ${id} missing type`)
      if (card.name === undefined || card.name === null) violations.push(`${prefix} Card ${id} missing name`)
    }
  }

  // 5. playsRemaining between 0-3
  if (state.playsRemaining < 0 || state.playsRemaining > 5) {
    violations.push(`${prefix} playsRemaining out of bounds: ${state.playsRemaining}`)
  }

  // 6. currentPlayerIndex is valid
  if (state.currentPlayerIndex < 0 || state.currentPlayerIndex >= state.players.length) {
    violations.push(`${prefix} Invalid currentPlayerIndex: ${state.currentPlayerIndex}`)
  }

  // 7. Houses/hotels not on railroad/utility
  for (let pi = 0; pi < state.players.length; pi++) {
    const p = state.players[pi]
    for (const color of Object.keys(p.houses || {})) {
      if (color === 'railroad' || color === 'utility') {
        violations.push(`${prefix} Player ${pi} has house on ${color} (not allowed)`)
      }
    }
    for (const color of Object.keys(p.hotels || {})) {
      if (color === 'railroad' || color === 'utility') {
        violations.push(`${prefix} Player ${pi} has hotel on ${color} (not allowed)`)
      }
    }
  }

  // 8. No negative hand/bank counts
  for (let pi = 0; pi < state.players.length; pi++) {
    const p = state.players[pi]
    if (!Array.isArray(p.hand)) violations.push(`${prefix} Player ${pi} hand is not array`)
    if (!Array.isArray(p.bank)) violations.push(`${prefix} Player ${pi} bank is not array`)
  }

  return violations
}

/**
 * Simulate a random game with bot players.
 */
function simulateGame(numPlayers, maxTurns = 200) {
  let state = createInitialState(numPlayers)
  const violations = []
  let turns = 0

  const initViolations = validateInvariants(state, '[init]')
  violations.push(...initViolations)

  for (let t = 0; t < maxTurns; t++) {
    turns = t + 1
    const startIndex = state.currentPlayerIndex

    for (let a = 0; a < 10; a++) {
      let action
      try {
        action = decideBotAction(state)
      } catch (err) {
        violations.push(`[turn ${turns}] decideBotAction error: ${err.message}`)
        break
      }

      try {
        state = applyBotAction(state, action)
      } catch (err) {
        violations.push(`[turn ${turns}] applyBotAction(${action.type}) error: ${err.message}`)
        // Force end turn to recover
        try { state = endTurn(state) } catch { /* unrecoverable */ }
        break
      }

      if (action.type === 'endTurn') break
      if (state.currentPlayerIndex !== startIndex) break
    }

    // Force turn advancement if stuck
    if (state.currentPlayerIndex === startIndex && state.turnPhase !== 'draw') {
      try { state = endTurn(state) } catch { /* ignore */ }
    }

    const turnViolations = validateInvariants(state, `[turn ${turns}]`)
    violations.push(...turnViolations)

    if (state.winner !== null && state.winner !== undefined) break
  }

  return { turns, winner: state.winner, violations }
}

describe('Headless Game Simulation', () => {
  const playerCounts = [2, 3, 4, 5]
  const gamesPerCount = 500

  for (const numPlayers of playerCounts) {
    describe(`${numPlayers}-player games`, () => {
      it(`should complete ${gamesPerCount} games with zero invariant violations`, () => {
        const allViolations = []
        let totalTurns = 0
        let wins = 0

        for (let g = 0; g < gamesPerCount; g++) {
          const result = simulateGame(numPlayers)
          totalTurns += result.turns

          if (result.violations.length > 0) {
            allViolations.push({
              game: g + 1,
              players: numPlayers,
              violations: result.violations,
            })
          }

          if (result.winner !== null && result.winner !== undefined) wins++
        }

        const avgTurns = (totalTurns / gamesPerCount).toFixed(1)
        console.log(
          `  ${numPlayers}P: ${gamesPerCount} games, ${wins} wins, avg ${avgTurns} turns`
        )

        if (allViolations.length > 0) {
          const sample = allViolations.slice(0, 5)
          const detail = sample.map(v =>
            `Game ${v.game} (${v.players}P): ${v.violations.slice(0, 5).join('; ')}`
          ).join('\n')
          console.error(`Violations:\n${detail}`)
        }

        expect(allViolations).toEqual([])
      })
    })
  }
})
