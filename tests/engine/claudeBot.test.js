// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createInitialState } from '../../src/engine/gameState.js'
import { executeClaudeTurn } from '../../src/engine/claudeBot.js'
import { isSetComplete } from '../../src/engine/properties.js'

const API_KEY = process.env.ANTHROPIC_API_KEY

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

function validateState(state, context) {
  const violations = []
  const allIds = collectAllCardIds(state)

  // No duplicate card IDs
  const seen = new Set()
  for (const id of allIds) {
    if (seen.has(id)) violations.push(`${context} Duplicate: ${id}`)
    seen.add(id)
  }

  // No empty property arrays
  for (let pi = 0; pi < state.players.length; pi++) {
    for (const [color, cards] of Object.entries(state.players[pi].properties)) {
      if (cards.length === 0) violations.push(`${context} Empty props: P${pi} ${color}`)
    }
  }

  // Valid player index
  if (state.currentPlayerIndex < 0 || state.currentPlayerIndex >= state.players.length) {
    violations.push(`${context} Bad currentPlayerIndex: ${state.currentPlayerIndex}`)
  }

  return violations
}

async function simulateClaudeGame(numPlayers, maxTurns = 100) {
  let state = createInitialState(numPlayers)
  const log = []
  const violations = []
  let turns = 0

  for (let t = 0; t < maxTurns; t++) {
    turns = t + 1
    const playerName = state.players[state.currentPlayerIndex].name

    try {
      const result = await executeClaudeTurn(state)
      state = result.state
      log.push({ turn: turns, player: playerName, actions: result.actions.map(a => a.type) })
    } catch (err) {
      violations.push(`Turn ${turns}: ${err.message}`)
      break
    }

    const turnViolations = validateState(state, `[T${turns}]`)
    violations.push(...turnViolations)

    if (state.winner !== null && state.winner !== undefined) break
  }

  return { turns, winner: state.winner, violations, log }
}

describe.skipIf(!API_KEY)('Claude Bot Games', () => {
  it('should complete 10 games with Claude-powered bots', async () => {
    const numGames = 10
    const results = []

    for (let g = 0; g < numGames; g++) {
      console.log(`  Game ${g + 1}/${numGames}...`)
      const result = await simulateClaudeGame(2)
      results.push(result)
      console.log(`    ${result.turns} turns, winner: ${result.winner !== null ? `P${result.winner}` : 'none'}, violations: ${result.violations.length}`)
    }

    const totalViolations = results.flatMap(r => r.violations)
    const wins = results.filter(r => r.winner !== null).length
    const avgTurns = (results.reduce((s, r) => s + r.turns, 0) / numGames).toFixed(1)

    console.log(`\n  Summary: ${wins}/${numGames} wins, avg ${avgTurns} turns, ${totalViolations.length} violations`)

    if (totalViolations.length > 0) {
      console.error('Violations:', totalViolations.slice(0, 10))
    }

    expect(totalViolations).toEqual([])
  }, 600000) // 10 minute timeout
})
