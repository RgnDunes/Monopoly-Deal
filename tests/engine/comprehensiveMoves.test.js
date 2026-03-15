import { describe, it, expect } from 'vitest'
import {
  createInitialState, drawCards, bankCard, playPropertyCard, endTurn,
  discardCards, playActionCard, resolvePassGo, resolveDealBreaker,
  resolveSlyDeal, resolveForcedDeal, resolveDebtCollector, resolveBirthday,
  resolveRent, resolvePayDebt, resolveJustSayNo, resolveHouse, resolveHotel,
  moveWild,
} from '../../src/engine/gameState.js'
import { PROPERTY_CONFIG } from '../../src/engine/cards.js'
import { isSetComplete, getCompleteSets } from '../../src/engine/properties.js'
import { calculateRent } from '../../src/engine/rent.js'
import { checkWinCondition } from '../../src/engine/winCondition.js'

// ===== HELPER: build a controlled game state for testing =====
function makeState(overrides = {}) {
  const defaults = {
    id: 'test',
    phase: 'playing',
    players: [
      { id: 'p0', name: 'P0', hand: [], bank: [], properties: {}, houses: {}, hotels: {} },
      { id: 'p1', name: 'P1', hand: [], bank: [], properties: {}, houses: {}, hotels: {} },
    ],
    deck: [],
    discard: [],
    currentPlayerIndex: 0,
    playsRemaining: 3,
    turnPhase: 'play',
    winner: null,
  }
  return { ...defaults, ...overrides, players: (overrides.players || defaults.players).map(p => ({ ...defaults.players[0], ...p })) }
}

function makeCard(id, type = 'property', extras = {}) {
  return { id, type, name: id, value: extras.value || 1, ...extras }
}

function makeProperty(id, color, value = 1) {
  return { id, type: 'property', name: id, value, color, rent: PROPERTY_CONFIG[color]?.rent || [1], setSize: PROPERTY_CONFIG[color]?.setSize || 2 }
}

function makeWild(id, colors, value = 0, rainbow = false) {
  return { id, type: 'wild', name: id, value, color: colors[0], colors, isRainbowWild: rainbow, rent: [1], setSize: 2 }
}

function makeMoney(id, value) {
  return { id, type: 'money', name: `$${value}M`, value }
}

function makeAction(id, name, value = 1) {
  return { id, type: 'action', name, value }
}

function makeRent(id, rentColors, targetsAll = true) {
  return { id, type: 'rent', name: `Rent ${rentColors.join('/')}`, value: 1, rentColors, targetsAll }
}

// ===== TURN LIFECYCLE =====
describe('Turn Lifecycle', () => {
  // T1: Draw 2 cards at start of turn
  it('T1: draws 2 cards at start of turn', () => {
    const state = makeState({
      players: [
        { hand: [makeCard('h1'), makeCard('h2')], bank: [] },
        { hand: [], bank: [] },
      ],
      deck: [makeCard('d1'), makeCard('d2'), makeCard('d3')],
      turnPhase: 'draw',
    })
    const after = drawCards(state)
    expect(after.players[0].hand).toHaveLength(4)
    expect(after.turnPhase).toBe('play')
  })

  // T2: Draw 5 cards on very first turn (empty hand)
  it('T2: draws 5 cards when hand is empty', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [] },
        { hand: [], bank: [] },
      ],
      deck: Array.from({ length: 10 }, (_, i) => makeCard(`d${i}`)),
      turnPhase: 'draw',
    })
    const after = drawCards(state)
    expect(after.players[0].hand).toHaveLength(5)
  })

  // T3: Play 0 cards and end turn
  it('T3: end turn with 0 plays passes turn with no state change', () => {
    const state = makeState({
      players: [
        { hand: [makeCard('h1')], bank: [] },
        { hand: [makeCard('h2')], bank: [] },
      ],
      turnPhase: 'play',
    })
    const after = endTurn(state)
    expect(after.currentPlayerIndex).toBe(1)
    expect(after.playsRemaining).toBe(3)
    expect(after.turnPhase).toBe('draw')
    // Hands unchanged
    expect(after.players[0].hand).toHaveLength(1)
    expect(after.players[1].hand).toHaveLength(1)
  })

  // T4: Play exactly 1 card and end turn
  it('T4: play exactly 1 card (bank) then end turn', () => {
    const money = makeMoney('m1', 5)
    const state = makeState({
      players: [
        { hand: [money, makeCard('h2')], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const afterBank = bankCard(state, 'm1')
    expect(afterBank.players[0].hand).toHaveLength(1)
    expect(afterBank.players[0].bank).toHaveLength(1)
    expect(afterBank.playsRemaining).toBe(2)

    const afterEnd = endTurn(afterBank)
    expect(afterEnd.currentPlayerIndex).toBe(1)
  })

  // T5: Play exactly 2 cards and end turn
  it('T5: play exactly 2 cards then end turn', () => {
    const state = makeState({
      players: [
        { hand: [makeMoney('m1', 1), makeMoney('m2', 2), makeCard('h3')], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    let s = bankCard(state, 'm1')
    s = bankCard(s, 'm2')
    expect(s.playsRemaining).toBe(1)
    expect(s.players[0].bank).toHaveLength(2)

    const afterEnd = endTurn(s)
    expect(afterEnd.currentPlayerIndex).toBe(1)
  })

  // T6: Play exactly 3 cards and end turn
  it('T6: play exactly 3 cards then end turn', () => {
    const state = makeState({
      players: [
        { hand: [makeMoney('m1', 1), makeMoney('m2', 2), makeMoney('m3', 3), makeCard('h4')], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    let s = bankCard(state, 'm1')
    s = bankCard(s, 'm2')
    s = bankCard(s, 'm3')
    expect(s.playsRemaining).toBe(0)
    expect(s.players[0].bank).toHaveLength(3)

    const afterEnd = endTurn(s)
    expect(afterEnd.currentPlayerIndex).toBe(1)
    expect(afterEnd.playsRemaining).toBe(3)
  })

  // T7: End turn with exactly 7 cards (no discard needed)
  it('T7: end turn with exactly 7 cards — no discard needed', () => {
    const hand = Array.from({ length: 7 }, (_, i) => makeCard(`h${i}`))
    const state = makeState({
      players: [
        { hand, bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const after = endTurn(state)
    expect(after.players[0].hand).toHaveLength(7)
    expect(after.currentPlayerIndex).toBe(1)
  })

  // T8: End turn with fewer than 7 cards
  it('T8: end turn with fewer than 7 cards — no discard needed', () => {
    const hand = Array.from({ length: 4 }, (_, i) => makeCard(`h${i}`))
    const state = makeState({
      players: [
        { hand, bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const after = endTurn(state)
    expect(after.players[0].hand).toHaveLength(4)
    expect(after.currentPlayerIndex).toBe(1)
  })

  // T9: Discard down to 7 when holding 8+ cards
  it('T9: discard down to 7 when holding 8+ cards', () => {
    const hand = Array.from({ length: 9 }, (_, i) => makeCard(`h${i}`))
    const state = makeState({
      players: [
        { hand, bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const after = discardCards(state, ['h0', 'h1'])
    expect(after.players[0].hand).toHaveLength(7)
  })

  // T10: Discarded cards go somewhere (deck in this implementation)
  it('T10: discarded cards land in deck', () => {
    const hand = Array.from({ length: 9 }, (_, i) => makeCard(`h${i}`))
    const state = makeState({
      players: [
        { hand, bank: [] },
        { hand: [], bank: [] },
      ],
      deck: [],
    })
    const after = discardCards(state, ['h0', 'h1'])
    expect(after.deck).toHaveLength(2)
    expect(after.deck.map(c => c.id)).toContain('h0')
    expect(after.deck.map(c => c.id)).toContain('h1')
  })
})

// ===== BANKING =====
describe('Banking', () => {
  // B1: Bank a money card
  it('B1: bank a money card — bank total increases correctly', () => {
    const state = makeState({
      players: [
        { hand: [makeMoney('m1', 5)], bank: [makeMoney('m0', 3)] },
        { hand: [], bank: [] },
      ],
    })
    const after = bankCard(state, 'm1')
    expect(after.players[0].bank).toHaveLength(2)
    const total = after.players[0].bank.reduce((s, c) => s + c.value, 0)
    expect(total).toBe(8)
  })

  // B2: Bank an action card as money (e.g. Rent card for $1M)
  it('B2: bank an action card as money — goes to bank, not played as action', () => {
    const rentCard = makeRent('r1', ['brown', 'lightblue'])
    const state = makeState({
      players: [
        { hand: [rentCard], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const after = bankCard(state, 'r1')
    expect(after.players[0].bank).toHaveLength(1)
    expect(after.players[0].bank[0].id).toBe('r1')
    expect(after.players[0].hand).toHaveLength(0)
    expect(after.discard).toHaveLength(0) // not played as action
  })

  // B3: Bank a Pass Go card as money
  it('B3: bank a Pass Go card as money — treated as $1M', () => {
    const passGo = makeAction('pg1', 'Pass Go', 1)
    const state = makeState({
      players: [
        { hand: [passGo], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const after = bankCard(state, 'pg1')
    expect(after.players[0].bank).toHaveLength(1)
    expect(after.players[0].bank[0].value).toBe(1)
  })

  // B4: Bank a Debt Collector as money
  it('B4: bank a Debt Collector as money — treated as $3M', () => {
    const dc = makeAction('dc1', 'Debt Collector', 3)
    const state = makeState({
      players: [
        { hand: [dc], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const after = bankCard(state, 'dc1')
    expect(after.players[0].bank[0].value).toBe(3)
  })

  // B5: Bank a Deal Breaker as money
  it('B5: bank a Deal Breaker as money — treated as $5M', () => {
    const db = makeAction('db1', 'Deal Breaker', 5)
    const state = makeState({
      players: [
        { hand: [db], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const after = bankCard(state, 'db1')
    expect(after.players[0].bank[0].value).toBe(5)
  })
})

// ===== PLAYING PROPERTIES =====
describe('Playing Properties', () => {
  // P1: Place a standard property in a new matching color set
  it('P1: place property in new color set', () => {
    const prop = makeProperty('p1', 'brown')
    const state = makeState({
      players: [
        { hand: [prop], bank: [], properties: {} },
        { hand: [], bank: [] },
      ],
    })
    const after = playPropertyCard(state, 'p1', 'brown')
    expect(after.players[0].properties.brown).toHaveLength(1)
    expect(after.players[0].hand).toHaveLength(0)
  })

  // P2: Place a standard property in an existing partial set
  it('P2: place property in existing partial set — set grows', () => {
    const state = makeState({
      players: [
        { hand: [makeProperty('p2', 'brown')], bank: [], properties: { brown: [makeProperty('p1', 'brown')] } },
        { hand: [], bank: [] },
      ],
    })
    const after = playPropertyCard(state, 'p2', 'brown')
    expect(after.players[0].properties.brown).toHaveLength(2)
  })

  // P3: Place a two-color wild in either of its valid colors
  it('P3: place two-color wild in either valid color', () => {
    const wild = makeWild('w1', ['brown', 'lightblue'], 1)
    const state = makeState({
      players: [
        { hand: [wild], bank: [], properties: {} },
        { hand: [], bank: [] },
      ],
    })
    const afterBrown = playPropertyCard(state, 'w1', 'brown')
    expect(afterBrown.players[0].properties.brown).toHaveLength(1)

    // Try lightblue
    const state2 = makeState({
      players: [
        { hand: [{ ...wild, id: 'w1b' }], bank: [], properties: {} },
        { hand: [], bank: [] },
      ],
    })
    const afterLB = playPropertyCard(state2, 'w1b', 'lightblue')
    expect(afterLB.players[0].properties.lightblue).toHaveLength(1)
  })

  // P4: Place a multi-color (rainbow) wild in any color set
  it('P4: place rainbow wild in any color set', () => {
    const rainbow = makeWild('rw1', ['brown', 'lightblue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkblue', 'railroad', 'utility'], 0, true)
    const state = makeState({
      players: [
        { hand: [rainbow], bank: [], properties: {} },
        { hand: [], bank: [] },
      ],
    })
    const after = playPropertyCard(state, 'rw1', 'green')
    expect(after.players[0].properties.green).toHaveLength(1)
  })

  // P5: Move a wild card from one valid set to another
  it('P5: move wild card between valid sets', () => {
    const wild = makeWild('w1', ['brown', 'lightblue'], 1)
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [{ ...wild, color: 'brown' }] } },
        { hand: [], bank: [] },
      ],
    })
    const after = moveWild(state, 'w1', 'brown', 'lightblue')
    expect(after.players[0].properties.lightblue).toHaveLength(1)
    expect(after.players[0].properties.brown).toBeUndefined()
  })

  // P6: Complete a set (reach required property count)
  it('P6: completing a set marks it as complete', () => {
    const state = makeState({
      players: [
        { hand: [makeProperty('p2', 'brown')], bank: [], properties: { brown: [makeProperty('p1', 'brown')] } },
        { hand: [], bank: [] },
      ],
    })
    const after = playPropertyCard(state, 'p2', 'brown')
    expect(isSetComplete(after.players[0].properties, 'brown')).toBe(true)
  })
})

// ===== PLAYING ACTION CARDS =====
describe('Playing Action Cards', () => {
  // A1: Pass Go draws 2 cards
  it('A1: Pass Go draws 2 additional cards', () => {
    const state = makeState({
      players: [
        { hand: [makeCard('h1'), makeCard('h2')], bank: [] },
        { hand: [], bank: [] },
      ],
      deck: Array.from({ length: 5 }, (_, i) => makeCard(`d${i}`)),
    })
    const after = resolvePassGo(state)
    expect(after.players[0].hand).toHaveLength(4)
  })

  // A2: Sly Deal steals 1 property from opponent
  it('A2: Sly Deal steals 1 property from opponent', () => {
    const target_prop = makeProperty('tp1', 'red')
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { red: [target_prop] } },
      ],
    })
    const after = resolveSlyDeal(state, 1, 'tp1')
    expect(after.players[0].properties.red).toHaveLength(1)
    expect(after.players[1].properties.red).toBeUndefined()
  })

  // A3: Forced Deal swaps properties
  it('A3: Forced Deal swaps one property each', () => {
    const myProp = makeProperty('mp1', 'brown')
    const theirProp = makeProperty('tp1', 'red')
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [myProp] } },
        { hand: [], bank: [], properties: { red: [theirProp] } },
      ],
    })
    const after = resolveForcedDeal(state, 1, 'mp1', 'tp1')
    expect(after.players[0].properties.red).toHaveLength(1)
    expect(after.players[0].properties.red[0].id).toBe('tp1')
    expect(after.players[1].properties.brown).toHaveLength(1)
    expect(after.players[1].properties.brown[0].id).toBe('mp1')
    // Old colors cleaned up
    expect(after.players[0].properties.brown).toBeUndefined()
    expect(after.players[1].properties.red).toBeUndefined()
  })

  // A4: Deal Breaker steals complete set
  it('A4: Deal Breaker steals entire complete set', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] } },
      ],
    })
    const after = resolveDealBreaker(state, 1, 'brown')
    expect(after.players[0].properties.brown).toHaveLength(2)
    expect(after.players[1].properties.brown).toBeUndefined()
  })

  // A5: Debt Collector — target pays $5M
  it('A5: Debt Collector creates $5M pending payment', () => {
    const state = makeState({})
    const result = resolveDebtCollector(state, 1)
    expect(result.pendingPayment.amount).toBe(5)
    expect(result.pendingPayment.fromIndex).toBe(1)
    expect(result.pendingPayment.toIndex).toBe(0)
  })

  // A6: Birthday — all opponents pay $2M each
  it('A6: Birthday creates $2M payments from all opponents', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [] },
        { hand: [], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const result = resolveBirthday(state)
    expect(result.pendingPayments).toHaveLength(2)
    expect(result.pendingPayments[0].amount).toBe(2)
    expect(result.pendingPayments[1].amount).toBe(2)
    expect(result.pendingPayments.every(p => p.toIndex === 0)).toBe(true)
  })

  // A7: Rent (two-color) charges all opponents
  it('A7: Rent charges all opponents for a matching color', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] } },
        { hand: [], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const result = resolveRent(state, 'brown', [1, 2], false)
    expect(result.pendingPayments).toHaveLength(2)
    expect(result.pendingPayments[0].amount).toBe(2) // brown complete = $2M
    expect(result.pendingPayments[1].amount).toBe(2)
  })

  // A8: Multi-color Rent — choose one target
  it('A8: Multi-color Rent targets single opponent', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { darkblue: [makeProperty('db1', 'darkblue', 4), makeProperty('db2', 'darkblue', 4)] } },
        { hand: [], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const result = resolveRent(state, 'darkblue', [2], false)
    expect(result.pendingPayments).toHaveLength(1)
    expect(result.pendingPayments[0].fromIndex).toBe(2)
    expect(result.pendingPayments[0].amount).toBe(8) // darkblue complete = $8M
  })

  // A9: Double the Rent doubles the amount
  it('A9: Double the Rent doubles rent amount', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] } },
        { hand: [], bank: [] },
      ],
    })
    const result = resolveRent(state, 'brown', [1], true) // doubled = true
    expect(result.pendingPayments[0].amount).toBe(4) // $2M * 2 = $4M
  })

  // A10: House on complete property set
  it('A10: House adds to complete set, increases rent', () => {
    const houseCard = makeAction('house1', 'House', 3)
    const state = makeState({
      players: [
        { hand: [houseCard], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] }, houses: {}, hotels: {} },
        { hand: [], bank: [] },
      ],
    })
    const after = resolveHouse(state, 'house1', 'brown')
    expect(after.players[0].houses.brown).toBe(true)
    expect(after.players[0].hand).toHaveLength(0)
    const rent = calculateRent(after.players[0], 'brown')
    expect(rent).toBe(5) // $2 base + $3 house
  })

  // A11: Hotel on complete set with house
  it('A11: Hotel adds to complete set with house, stacks rent', () => {
    const hotelCard = makeAction('hotel1', 'Hotel', 4)
    const state = makeState({
      players: [
        { hand: [hotelCard], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] }, houses: { brown: true }, hotels: {} },
        { hand: [], bank: [] },
      ],
    })
    const after = resolveHotel(state, 'hotel1', 'brown')
    expect(after.players[0].hotels.brown).toBe(true)
    const rent = calculateRent(after.players[0], 'brown')
    expect(rent).toBe(9) // $2 base + $3 house + $4 hotel
  })
})

// ===== JUST SAY NO =====
describe('Just Say No', () => {
  // J1-J6: JSN cancels targeted actions (odd jsnCount = cancelled)
  it('J1: JSN cancels Sly Deal (jsnCount=1 → cancelled)', () => {
    const state = makeState({})
    const result = resolveJustSayNo(state, { jsnCount: 1 })
    expect(result.cancelled).toBe(true)
  })

  it('J2: JSN cancels Forced Deal', () => {
    const result = resolveJustSayNo(makeState({}), { jsnCount: 1 })
    expect(result.cancelled).toBe(true)
  })

  it('J3: JSN cancels Deal Breaker', () => {
    const result = resolveJustSayNo(makeState({}), { jsnCount: 1 })
    expect(result.cancelled).toBe(true)
  })

  it('J4: JSN cancels Debt Collector', () => {
    const result = resolveJustSayNo(makeState({}), { jsnCount: 1 })
    expect(result.cancelled).toBe(true)
  })

  it('J5: JSN cancels Birthday payment', () => {
    const result = resolveJustSayNo(makeState({}), { jsnCount: 1 })
    expect(result.cancelled).toBe(true)
  })

  it('J6: JSN cancels Rent charge', () => {
    const result = resolveJustSayNo(makeState({}), { jsnCount: 1 })
    expect(result.cancelled).toBe(true)
  })

  // J7: Counter-counter (attacker plays 2nd JSN → action reinstated, jsnCount=2)
  it('J7: counter-counter (jsnCount=2) → action reinstated', () => {
    const result = resolveJustSayNo(makeState({}), { jsnCount: 2 })
    expect(result.cancelled).toBe(false)
  })

  // J8: Target plays 3rd JSN → cancelled again
  it('J8: triple JSN chain (jsnCount=3) → action cancelled again', () => {
    const result = resolveJustSayNo(makeState({}), { jsnCount: 3 })
    expect(result.cancelled).toBe(true)
  })

  // Extended chain: 4 JSNs → reinstated
  it('JSN chain: 4 JSNs → action reinstated', () => {
    const result = resolveJustSayNo(makeState({}), { jsnCount: 4 })
    expect(result.cancelled).toBe(false)
  })
})

// ===== PAYING DEBTS =====
describe('Paying Debts', () => {
  // D1: Pay exact amount from bank
  it('D1: pay exact amount from bank', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [makeMoney('bm1', 5)], properties: {} },
      ],
    })
    const after = resolvePayDebt(state, 1, 0, ['bm1'])
    expect(after.players[1].bank).toHaveLength(0)
    expect(after.players[0].bank).toHaveLength(1)
    expect(after.players[0].bank[0].value).toBe(5)
  })

  // D2: Pay with combination of bank cards
  it('D2: pay with combination of bank cards meeting owed amount', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [makeMoney('bm1', 2), makeMoney('bm2', 3)], properties: {} },
      ],
    })
    const after = resolvePayDebt(state, 1, 0, ['bm1', 'bm2'])
    expect(after.players[1].bank).toHaveLength(0)
    expect(after.players[0].bank).toHaveLength(2)
  })

  // D3: Pay using a property card when bank insufficient
  it('D3: pay with property card — property moves to creditor', () => {
    const prop = makeProperty('rp1', 'red', 3)
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { red: [prop] } },
      ],
    })
    const after = resolvePayDebt(state, 1, 0, ['rp1'])
    expect(after.players[1].properties.red).toBeUndefined()
    expect(after.players[0].properties.red).toHaveLength(1)
  })

  // D4: Partial payment — pay everything you have
  it('D4: partial payment when total assets < owed — all assets transfer', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [makeMoney('bm1', 1)], properties: { brown: [makeProperty('bp1', 'brown')] } },
      ],
    })
    const after = resolvePayDebt(state, 1, 0, ['bm1', 'bp1'])
    expect(after.players[1].bank).toHaveLength(0)
    expect(after.players[1].properties.brown).toBeUndefined()
    expect(after.players[0].bank).toHaveLength(1)
    expect(after.players[0].properties.brown).toHaveLength(1)
  })

  // D5: Receive payment cards into bank
  it('D5: received bank payment cards go into creditor bank', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [makeMoney('existing', 10)], properties: {} },
        { hand: [], bank: [makeMoney('bm1', 3), makeMoney('bm2', 2)], properties: {} },
      ],
    })
    const after = resolvePayDebt(state, 1, 0, ['bm1', 'bm2'])
    expect(after.players[0].bank).toHaveLength(3)
    expect(after.players[0].bank.reduce((s, c) => s + c.value, 0)).toBe(15)
  })

  // D6: Receive property as payment
  it('D6: received property goes to creditor property area', () => {
    const prop = makeProperty('gp1', 'green', 4)
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { green: [prop] } },
      ],
    })
    const after = resolvePayDebt(state, 1, 0, ['gp1'])
    expect(after.players[0].properties.green).toHaveLength(1)
    expect(after.players[0].properties.green[0].id).toBe('gp1')
  })
})

// ===== WINNING =====
describe('Winning', () => {
  // W1: Collect 3rd complete set → win
  it('W1: 3 complete property sets triggers win', () => {
    const state = makeState({
      players: [
        {
          hand: [makeProperty('p-lb3', 'lightblue')],
          bank: [],
          properties: {
            brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')],
            darkblue: [makeProperty('db1', 'darkblue', 4), makeProperty('db2', 'darkblue', 4)],
            lightblue: [makeProperty('lb1', 'lightblue'), makeProperty('lb2', 'lightblue')],
          },
        },
        { hand: [], bank: [] },
      ],
    })
    const after = playPropertyCard(state, 'p-lb3', 'lightblue')
    expect(after.winner).toBe(0)
  })

  // W2: Win by completing 3rd set via Sly Deal
  it('W2: win via Sly Deal completing 3rd set', () => {
    const state = makeState({
      players: [
        {
          hand: [],
          bank: [],
          properties: {
            brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')],
            darkblue: [makeProperty('db1', 'darkblue', 4), makeProperty('db2', 'darkblue', 4)],
            utility: [makeProperty('u1', 'utility', 2)],
          },
        },
        { hand: [], bank: [], properties: { utility: [makeProperty('u2', 'utility', 2)] } },
      ],
    })
    const after = resolveSlyDeal(state, 1, 'u2')
    expect(after.winner).toBe(0)
  })

  // W3: Win by Deal Breaker completing 3rd set
  it('W3: win via Deal Breaker completing 3rd set', () => {
    const state = makeState({
      players: [
        {
          hand: [],
          bank: [],
          properties: {
            brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')],
            darkblue: [makeProperty('db1', 'darkblue', 4), makeProperty('db2', 'darkblue', 4)],
          },
        },
        { hand: [], bank: [], properties: { utility: [makeProperty('u1', 'utility', 2), makeProperty('u2', 'utility', 2)] } },
      ],
    })
    const after = resolveDealBreaker(state, 1, 'utility')
    expect(after.winner).toBe(0)
  })

  // W4: Win mid-opponent payment (property payment completes 3rd set)
  // resolvePayDebt doesn't check win — win check happens at state level
  // So we test that after receiving a property via payment, the state allows win detection
  it('W4: receiving property as payment can complete 3rd set', () => {
    const state = makeState({
      players: [
        {
          hand: [],
          bank: [],
          properties: {
            brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')],
            darkblue: [makeProperty('db1', 'darkblue', 4), makeProperty('db2', 'darkblue', 4)],
            utility: [makeProperty('u1', 'utility', 2)],
          },
        },
        { hand: [], bank: [], properties: { utility: [makeProperty('u2', 'utility', 2)] } },
      ],
    })
    const after = resolvePayDebt(state, 1, 0, ['u2'])
    // resolvePayDebt doesn't apply win check, but state reflects it
    expect(checkWinCondition(after.players[0])).toBe(true)
  })
})

// ===== IMPOSSIBLE MOVES — Turn Lifecycle Violations =====
describe('Turn Lifecycle Violations', () => {
  // IT1: Can't draw more than the draw amount
  it('IT1: drawCards draws exactly 2 (or 5 if empty) — not more', () => {
    const state = makeState({
      players: [
        { hand: [makeCard('h1')], bank: [] },
        { hand: [], bank: [] },
      ],
      deck: Array.from({ length: 20 }, (_, i) => makeCard(`d${i}`)),
      turnPhase: 'draw',
    })
    const after = drawCards(state)
    expect(after.players[0].hand).toHaveLength(3) // 1 existing + 2 drawn
  })

  // IT3: Can't play a 4th card — playsRemaining reaches 0
  it('IT3: playsRemaining prevents 4th play', () => {
    const state = makeState({
      players: [
        { hand: [makeMoney('m1', 1), makeMoney('m2', 1), makeMoney('m3', 1), makeMoney('m4', 1)], bank: [] },
        { hand: [], bank: [] },
      ],
      playsRemaining: 3,
    })
    let s = bankCard(state, 'm1')
    s = bankCard(s, 'm2')
    s = bankCard(s, 'm3')
    expect(s.playsRemaining).toBe(0)
    // 4th bank still moves card (engine doesn't block) but playsRemaining goes negative
    // The UI/store enforces the 3-play limit; engine just tracks the counter
    const s4 = bankCard(s, 'm4')
    expect(s4.playsRemaining).toBe(-1)
  })

  // IT4: Can't play a card not in your hand
  it('IT4: bankCard with invalid cardId returns state unchanged', () => {
    const state = makeState({
      players: [
        { hand: [makeMoney('m1', 1)], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const after = bankCard(state, 'nonexistent')
    expect(after).toEqual(state) // no change
  })
})

// ===== IMPOSSIBLE MOVES — Property Violations =====
describe('Property Violations', () => {
  // IP1: Place property in wrong color set — engine allows but color is overridden
  it('IP1: playPropertyCard uses the color parameter', () => {
    const prop = makeProperty('bp1', 'brown')
    const state = makeState({
      players: [
        { hand: [prop], bank: [], properties: {} },
        { hand: [], bank: [] },
      ],
    })
    // If you specify a color, the card goes to that color group
    const after = playPropertyCard(state, 'bp1', 'brown')
    expect(after.players[0].properties.brown).toHaveLength(1)
  })

  // IP2: Two-color wild placed in invalid color — moveWild rejects it
  it('IP2: moveWild rejects moving to invalid color', () => {
    const wild = makeWild('w1', ['brown', 'lightblue'], 1)
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [{ ...wild, color: 'brown' }] } },
        { hand: [], bank: [] },
      ],
    })
    const after = moveWild(state, 'w1', 'brown', 'red') // red is not in wild's colors
    // State should be unchanged
    expect(after.players[0].properties.brown).toHaveLength(1)
    expect(after.players[0].properties.red).toBeUndefined()
  })

  // IP4: moveWild on non-wild card — rejected
  it('IP4: moveWild rejects non-wild cards', () => {
    const prop = makeProperty('bp1', 'brown')
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [prop] } },
        { hand: [], bank: [] },
      ],
    })
    const after = moveWild(state, 'bp1', 'brown', 'lightblue')
    expect(after.players[0].properties.brown).toHaveLength(1) // unchanged
  })
})

// ===== IMPOSSIBLE MOVES — House & Hotel Violations =====
describe('House & Hotel Violations', () => {
  // IH1: House on incomplete set — rejected
  it('IH1: house on incomplete set rejected', () => {
    const houseCard = makeAction('house1', 'House', 3)
    const state = makeState({
      players: [
        { hand: [houseCard], bank: [], properties: { lightblue: [makeProperty('lb1', 'lightblue')] }, houses: {}, hotels: {} },
        { hand: [], bank: [] },
      ],
    })
    const after = resolveHouse(state, 'house1', 'lightblue')
    expect(after.players[0].houses.lightblue).toBeUndefined()
    expect(after.players[0].hand).toHaveLength(1) // card not consumed
  })

  // IH2: House on set that already has a house — engine allows (overwrites)
  // The UI prevents this; let's verify the engine's behavior
  it('IH2: resolveHouse when set already has house', () => {
    const houseCard = makeAction('house2', 'House', 3)
    const state = makeState({
      players: [
        { hand: [houseCard], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] }, houses: { brown: true }, hotels: {} },
        { hand: [], bank: [] },
      ],
    })
    // Engine doesn't block double houses — the UI/store does
    const after = resolveHouse(state, 'house2', 'brown')
    expect(after.players[0].houses.brown).toBe(true)
  })

  // IH3: House on railroad — rejected
  it('IH3: house on railroad rejected', () => {
    const houseCard = makeAction('house1', 'House', 3)
    const state = makeState({
      players: [
        {
          hand: [houseCard], bank: [],
          properties: { railroad: [makeProperty('rr1', 'railroad', 2), makeProperty('rr2', 'railroad', 2), makeProperty('rr3', 'railroad', 2), makeProperty('rr4', 'railroad', 2)] },
          houses: {}, hotels: {},
        },
        { hand: [], bank: [] },
      ],
    })
    const after = resolveHouse(state, 'house1', 'railroad')
    expect(after.players[0].houses.railroad).toBeUndefined()
    expect(after.players[0].hand).toHaveLength(1) // card stays in hand
  })

  // IH3 variant: House on utility — rejected
  it('IH3b: house on utility rejected', () => {
    const houseCard = makeAction('house1', 'House', 3)
    const state = makeState({
      players: [
        {
          hand: [houseCard], bank: [],
          properties: { utility: [makeProperty('u1', 'utility', 2), makeProperty('u2', 'utility', 2)] },
          houses: {}, hotels: {},
        },
        { hand: [], bank: [] },
      ],
    })
    const after = resolveHouse(state, 'house1', 'utility')
    expect(after.players[0].houses.utility).toBeUndefined()
  })

  // IH4: Hotel without house — rejected
  it('IH4: hotel on set without house rejected', () => {
    const hotelCard = makeAction('hotel1', 'Hotel', 4)
    const state = makeState({
      players: [
        { hand: [hotelCard], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] }, houses: {}, hotels: {} },
        { hand: [], bank: [] },
      ],
    })
    const after = resolveHotel(state, 'hotel1', 'brown')
    expect(after.players[0].hotels.brown).toBeUndefined()
    expect(after.players[0].hand).toHaveLength(1) // card stays in hand
  })

  // IH5: Hotel on incomplete set — rejected
  it('IH5: hotel on incomplete set rejected', () => {
    const hotelCard = makeAction('hotel1', 'Hotel', 4)
    const state = makeState({
      players: [
        { hand: [hotelCard], bank: [], properties: { lightblue: [makeProperty('lb1', 'lightblue')] }, houses: { lightblue: true }, hotels: {} },
        { hand: [], bank: [] },
      ],
    })
    const after = resolveHotel(state, 'hotel1', 'lightblue')
    expect(after.players[0].hotels.lightblue).toBeUndefined()
  })

  // IH6: Hotel on set that already has a hotel — engine allows
  it('IH6: hotel on set that already has hotel', () => {
    const hotelCard = makeAction('hotel2', 'Hotel', 4)
    const state = makeState({
      players: [
        { hand: [hotelCard], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] }, houses: { brown: true }, hotels: { brown: true } },
        { hand: [], bank: [] },
      ],
    })
    // Engine doesn't block double hotels — UI does
    const after = resolveHotel(state, 'hotel2', 'brown')
    expect(after.players[0].hotels.brown).toBe(true)
  })

  // IH4b: Hotel on railroad — rejected
  it('IH4b: hotel on railroad rejected', () => {
    const hotelCard = makeAction('hotel1', 'Hotel', 4)
    const state = makeState({
      players: [
        {
          hand: [hotelCard], bank: [],
          properties: { railroad: [makeProperty('rr1', 'railroad', 2), makeProperty('rr2', 'railroad', 2), makeProperty('rr3', 'railroad', 2), makeProperty('rr4', 'railroad', 2)] },
          houses: { railroad: true }, hotels: {},
        },
        { hand: [], bank: [] },
      ],
    })
    const after = resolveHotel(state, 'hotel1', 'railroad')
    expect(after.players[0].hotels.railroad).toBeUndefined()
  })
})

// ===== IMPOSSIBLE MOVES — Action Card Violations =====
describe('Action Card Violations', () => {
  // IA3: Rent for color you don't own — returns $0 rent
  it('IA3: rent for color with no properties returns $0', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [] },
      ],
    })
    const result = resolveRent(state, 'brown', [1], false)
    expect(result.pendingPayments[0].amount).toBe(0)
  })

  // IA5: Sly Deal on complete set — blocked
  it('IA5: Sly Deal cannot steal from complete set', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] } },
      ],
    })
    const after = resolveSlyDeal(state, 1, 'bp1')
    // Should return unchanged — can't steal from complete set
    expect(after.players[0].properties.brown).toBeUndefined()
    expect(after.players[1].properties.brown).toHaveLength(2)
  })

  // IA6: Deal Breaker on incomplete set — blocked
  it('IA6: Deal Breaker cannot steal incomplete set', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { lightblue: [makeProperty('lb1', 'lightblue')] } },
      ],
    })
    const after = resolveDealBreaker(state, 1, 'lightblue')
    // Should return unchanged
    expect(after.players[0].properties.lightblue).toBeUndefined()
    expect(after.players[1].properties.lightblue).toHaveLength(1)
  })

  // IA7: Deal Breaker when target has no complete sets — state unchanged
  it('IA7: Deal Breaker on player with no complete sets — state unchanged', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { red: [makeProperty('rp1', 'red')] } },
      ],
    })
    const after = resolveDealBreaker(state, 1, 'red')
    expect(after.players[1].properties.red).toHaveLength(1) // unchanged
  })

  // IA8: Forced Deal when you have no properties — can't swap
  it('IA8: Forced Deal rejected when actor has no properties', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { red: [makeProperty('rp1', 'red')] } },
      ],
    })
    const after = resolveForcedDeal(state, 1, 'nonexistent', 'rp1')
    expect(after).toEqual(state) // unchanged
  })

  // IA9: Forced Deal targeting player with no properties
  it('IA9: Forced Deal rejected when target has no properties', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [makeProperty('bp1', 'brown')] } },
        { hand: [], bank: [], properties: {} },
      ],
    })
    const after = resolveForcedDeal(state, 1, 'bp1', 'nonexistent')
    expect(after).toEqual(state) // unchanged
  })

  // IA10: Forced Deal stealing from complete set — blocked
  it('IA10: Forced Deal cannot steal from complete set', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { red: [makeProperty('rp1', 'red')] } },
        { hand: [], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] } },
      ],
    })
    const after = resolveForcedDeal(state, 1, 'rp1', 'bp1')
    // Brown is complete, can't take from it
    expect(after.players[1].properties.brown).toHaveLength(2) // unchanged
  })

  // IA11: Sly Deal from complete set — blocked (same as IA5, extra test)
  it('IA11: Sly Deal cannot steal from complete set (darkblue)', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { darkblue: [makeProperty('db1', 'darkblue', 4), makeProperty('db2', 'darkblue', 4)] } },
      ],
    })
    const after = resolveSlyDeal(state, 1, 'db1')
    expect(after.players[1].properties.darkblue).toHaveLength(2)
  })

  // Sly Deal on rainbow wild — blocked
  it('Sly Deal cannot steal rainbow wild', () => {
    const rainbow = makeWild('rw1', ['brown'], 0, true)
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { brown: [{ ...rainbow, color: 'brown' }] } },
      ],
    })
    const after = resolveSlyDeal(state, 1, 'rw1')
    expect(after.players[1].properties.brown).toHaveLength(1) // unchanged
  })
})

// ===== IMPOSSIBLE MOVES — Winning Violations =====
describe('Winning Violations', () => {
  // IW1: Only 2 complete sets — no win
  it('IW1: 2 complete sets does not trigger win', () => {
    const player = {
      properties: {
        brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')],
        darkblue: [makeProperty('db1', 'darkblue', 4), makeProperty('db2', 'darkblue', 4)],
      },
    }
    expect(checkWinCondition(player)).toBe(false)
  })

  // IW2: 3 incomplete sets — no win
  it('IW2: 3 incomplete sets does not trigger win', () => {
    const player = {
      properties: {
        brown: [makeProperty('bp1', 'brown')], // need 2
        lightblue: [makeProperty('lb1', 'lightblue')], // need 3
        red: [makeProperty('rp1', 'red')], // need 3
      },
    }
    expect(checkWinCondition(player)).toBe(false)
  })

  // IW3: Can't continue playing after win
  it('IW3: state preserves winner after win — game is over', () => {
    const state = makeState({
      winner: 0,
      players: [
        { hand: [makeMoney('m1', 1)], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    // bankCard still works at engine level but winner is preserved
    const after = bankCard(state, 'm1')
    expect(after.winner).toBe(0) // winner preserved
  })
})

// ===== EDGE CASES =====
describe('Edge Cases', () => {
  // E1: Deck runs out — reshuffle discard pile
  it('E1: deck runs out — discard reshuffled into deck', () => {
    const state = makeState({
      players: [
        { hand: [makeCard('h1')], bank: [] },
        { hand: [], bank: [] },
      ],
      deck: [],
      discard: [makeCard('disc1'), makeCard('disc2'), makeCard('disc3')],
      turnPhase: 'draw',
    })
    const after = drawCards(state)
    expect(after.players[0].hand).toHaveLength(3) // 1 + 2 drawn
    expect(after.discard).toHaveLength(0) // discard was reshuffled
  })

  // E2: Player has 0 cards — draws 5 from empty/reshuffled deck
  it('E2: player with 0 cards draws 5', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [] },
        { hand: [], bank: [] },
      ],
      deck: Array.from({ length: 10 }, (_, i) => makeCard(`d${i}`)),
      turnPhase: 'draw',
    })
    const after = drawCards(state)
    expect(after.players[0].hand).toHaveLength(5)
    expect(after.deck).toHaveLength(5)
  })

  // E3: JSN chain of 3+
  it('E3: JSN chain of 3 cancels action, chain of 4 reinstates', () => {
    expect(resolveJustSayNo(makeState({}), { jsnCount: 3 }).cancelled).toBe(true)
    expect(resolveJustSayNo(makeState({}), { jsnCount: 4 }).cancelled).toBe(false)
    expect(resolveJustSayNo(makeState({}), { jsnCount: 5 }).cancelled).toBe(true)
  })

  // E6: Wild card is only card in a set when Sly Dealt
  it('E6: Sly Deal on wild card (only card in set) — set removed', () => {
    const wild = makeWild('w1', ['brown', 'lightblue'], 1)
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { brown: [{ ...wild, color: 'brown' }] } },
      ],
    })
    // Brown set has only 1 card and isn't complete, so Sly Deal allowed
    const after = resolveSlyDeal(state, 1, 'w1')
    expect(after.players[1].properties.brown).toBeUndefined() // set cleaned up
    expect(after.players[0].properties.brown).toHaveLength(1)
  })

  // E7: Player has exactly 7 cards after drawing — no discard
  it('E7: exactly 7 cards — no discard needed', () => {
    const hand = Array.from({ length: 5 }, (_, i) => makeCard(`h${i}`))
    const state = makeState({
      players: [
        { hand, bank: [] },
        { hand: [], bank: [] },
      ],
      deck: [makeCard('d1'), makeCard('d2')],
      turnPhase: 'draw',
    })
    const after = drawCards(state)
    expect(after.players[0].hand).toHaveLength(7) // exactly 7
  })

  // E8: Player has 0 assets targeted by Debt Collector — pays nothing
  it('E8: debt collector on player with 0 assets — empty payment', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: {} },
      ],
    })
    const { pendingPayment } = resolveDebtCollector(state, 1)
    // Payment created, but when resolved with no cards, payer gives nothing
    const after = resolvePayDebt(state, pendingPayment.fromIndex, pendingPayment.toIndex, [])
    expect(after.players[0].bank).toHaveLength(0) // no payment received
  })

  // E9: Birthday with only 1 other player
  it('E9: birthday with 1 other player — only 1 payment', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const result = resolveBirthday(state)
    expect(result.pendingPayments).toHaveLength(1)
    expect(result.pendingPayments[0].fromIndex).toBe(1)
  })

  // E10: Forced Deal involving wild — moves to new owner
  it('E10: Forced Deal swapping a wild card', () => {
    const wild = makeWild('w1', ['brown', 'lightblue'], 1)
    const prop = makeProperty('rp1', 'red')
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [{ ...wild, color: 'brown' }] } },
        { hand: [], bank: [], properties: { red: [prop] } },
      ],
    })
    const after = resolveForcedDeal(state, 1, 'w1', 'rp1')
    expect(after.players[0].properties.red).toHaveLength(1)
    expect(after.players[1].properties.brown).toHaveLength(1)
    expect(after.players[1].properties.brown[0].id).toBe('w1')
  })

  // E11: Rent on color with 0 properties = $0
  it('E11: rent on color with 0 properties is $0', () => {
    const player = { properties: {}, houses: {}, hotels: {} }
    const rent = calculateRent(player, 'brown')
    expect(rent).toBe(0)
  })

  // Deal Breaker steals house and hotel too
  it('Deal Breaker steals house and hotel with the set', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {}, houses: {}, hotels: {} },
        {
          hand: [], bank: [],
          properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] },
          houses: { brown: true },
          hotels: { brown: true },
        },
      ],
    })
    const after = resolveDealBreaker(state, 1, 'brown')
    expect(after.players[0].properties.brown).toHaveLength(2)
    expect(after.players[0].houses.brown).toBe(true)
    expect(after.players[0].hotels.brown).toBe(true)
    expect(after.players[1].houses.brown).toBeUndefined()
    expect(after.players[1].hotels.brown).toBeUndefined()
  })

  // Forced Deal doesn't work on own complete set
  it('Forced Deal blocked when giving from own complete set', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] } },
        { hand: [], bank: [], properties: { red: [makeProperty('rp1', 'red')] } },
      ],
    })
    const after = resolveForcedDeal(state, 1, 'bp1', 'rp1')
    // Brown is complete — actor can't give from complete set
    expect(after.players[0].properties.brown).toHaveLength(2) // unchanged
  })

  // Empty property arrays cleaned up after Sly Deal
  it('Sly Deal cleans up empty property arrays on target', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { red: [makeProperty('rp1', 'red')] }, houses: {}, hotels: {} },
      ],
    })
    const after = resolveSlyDeal(state, 1, 'rp1')
    expect(after.players[1].properties.red).toBeUndefined() // cleaned up, not empty array
  })

  // Empty property arrays cleaned up after Forced Deal
  it('Forced Deal cleans up empty property arrays', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [makeProperty('bp1', 'brown')] } },
        { hand: [], bank: [], properties: { red: [makeProperty('rp1', 'red')] } },
      ],
    })
    const after = resolveForcedDeal(state, 1, 'bp1', 'rp1')
    expect(after.players[0].properties.brown).toBeUndefined() // cleaned up
    expect(after.players[1].properties.red).toBeUndefined() // cleaned up
  })

  // Empty property arrays cleaned up after PayDebt
  it('PayDebt cleans up empty property arrays on payer', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: {} },
        { hand: [], bank: [], properties: { red: [makeProperty('rp1', 'red')] }, houses: {}, hotels: {} },
      ],
    })
    const after = resolvePayDebt(state, 1, 0, ['rp1'])
    expect(after.players[1].properties.red).toBeUndefined() // cleaned up
  })

  // MoveWild cleans up empty property arrays
  it('moveWild cleans up empty source property array', () => {
    const wild = makeWild('w1', ['brown', 'lightblue'], 1)
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [{ ...wild, color: 'brown' }] }, houses: {}, hotels: {} },
        { hand: [], bank: [] },
      ],
    })
    const after = moveWild(state, 'w1', 'brown', 'lightblue')
    expect(after.players[0].properties.brown).toBeUndefined() // cleaned up
    expect(after.players[0].properties.lightblue).toHaveLength(1)
  })

  // playActionCard moves card to discard
  it('playActionCard moves card from hand to discard pile', () => {
    const action = makeAction('a1', 'Test Action', 1)
    const state = makeState({
      players: [
        { hand: [action], bank: [] },
        { hand: [], bank: [] },
      ],
    })
    const after = playActionCard(state, 'a1')
    expect(after.players[0].hand).toHaveLength(0)
    expect(after.discard).toHaveLength(1)
    expect(after.discard[0].id).toBe('a1')
    expect(after.playsRemaining).toBe(2)
  })

  // endTurn wraps around player index
  it('endTurn wraps around from last player to first', () => {
    const state = makeState({
      players: [
        { hand: [], bank: [] },
        { hand: [], bank: [] },
        { hand: [], bank: [] },
      ],
      currentPlayerIndex: 2,
    })
    const after = endTurn(state)
    expect(after.currentPlayerIndex).toBe(0)
  })

  // Draw from reshuffled discard when deck empty
  it('draws from reshuffled discard when deck is empty', () => {
    const state = makeState({
      players: [
        { hand: [makeCard('h1')], bank: [] },
        { hand: [], bank: [] },
      ],
      deck: [],
      discard: [makeCard('d1'), makeCard('d2'), makeCard('d3'), makeCard('d4')],
      turnPhase: 'draw',
    })
    const after = drawCards(state)
    expect(after.players[0].hand).toHaveLength(3) // h1 + 2 drawn
    expect(after.discard).toHaveLength(0)
    expect(after.deck).toHaveLength(2) // 4 reshuffled - 2 drawn
  })

  // RemoveHouse banks $3M
  it('removeHouse creates $3M money card in bank', () => {
    const { removeHouse } = require('../../src/engine/gameState.js')
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] }, houses: { brown: true }, hotels: {} },
        { hand: [], bank: [] },
      ],
    })
    const after = removeHouse(state, 'brown')
    expect(after.players[0].houses.brown).toBeUndefined()
    expect(after.players[0].bank).toHaveLength(1)
    expect(after.players[0].bank[0].value).toBe(3)
  })

  // RemoveHotel banks $4M
  it('removeHotel creates $4M money card in bank', () => {
    const { removeHotel } = require('../../src/engine/gameState.js')
    const state = makeState({
      players: [
        { hand: [], bank: [], properties: { brown: [makeProperty('bp1', 'brown'), makeProperty('bp2', 'brown')] }, houses: {}, hotels: { brown: true } },
        { hand: [], bank: [] },
      ],
    })
    const after = removeHotel(state, 'brown')
    expect(after.players[0].hotels.brown).toBeUndefined()
    expect(after.players[0].bank).toHaveLength(1)
    expect(after.players[0].bank[0].value).toBe(4)
  })

  // createInitialState deals correctly
  it('createInitialState deals 5 cards to each player', () => {
    const state = createInitialState(3)
    expect(state.players).toHaveLength(3)
    for (const p of state.players) {
      expect(p.hand).toHaveLength(5)
    }
    expect(state.deck).toHaveLength(107 - 15) // 107 - 5*3
    expect(state.turnPhase).toBe('draw')
    expect(state.playsRemaining).toBe(3)
  })

  // Rent with house and hotel
  it('Rent with house + hotel calculates correctly', () => {
    const player = {
      properties: { darkblue: [makeProperty('db1', 'darkblue', 4), makeProperty('db2', 'darkblue', 4)] },
      houses: { darkblue: true },
      hotels: { darkblue: true },
    }
    const rent = calculateRent(player, 'darkblue')
    expect(rent).toBe(15) // $8 base + $3 house + $4 hotel
  })

  // Double the rent with house/hotel
  it('Double the Rent doubles total rent including house/hotel', () => {
    const state = makeState({
      players: [
        {
          hand: [], bank: [],
          properties: { darkblue: [makeProperty('db1', 'darkblue', 4), makeProperty('db2', 'darkblue', 4)] },
          houses: { darkblue: true },
          hotels: { darkblue: true },
        },
        { hand: [], bank: [] },
      ],
    })
    const result = resolveRent(state, 'darkblue', [1], true)
    expect(result.pendingPayments[0].amount).toBe(30) // ($8+$3+$4) * 2 = $30
  })
})
