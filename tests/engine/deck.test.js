import { describe, it, expect } from 'vitest'
import { createDeck, drawFromDeck } from '../../src/engine/deck.js'
import { ALL_CARDS } from '../../src/engine/cards.js'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createDeck', () => {
  it('should return an array with the same length as ALL_CARDS', () => {
    const deck = createDeck()
    expect(deck.length).toBe(ALL_CARDS.length)
  })

  it('should contain all the same cards as ALL_CARDS', () => {
    const deck = createDeck()
    const deckIds = deck.map(c => c.id).sort()
    const allIds = ALL_CARDS.map(c => c.id).sort()
    expect(deckIds).toEqual(allIds)
  })

  it('should shuffle the deck (two calls produce different orders)', () => {
    // Run multiple attempts -- shuffling is random, so we check that at least
    // one of several pairs differs. The probability of two independent shuffles
    // being identical for a 107-card deck is astronomically low.
    const deck1 = createDeck()
    const deck2 = createDeck()

    const ids1 = deck1.map(c => c.id)
    const ids2 = deck2.map(c => c.id)

    // At least one position should differ
    const hasDifference = ids1.some((id, i) => id !== ids2[i])
    expect(hasDifference).toBe(true)
  })

  it('should not mutate ALL_CARDS', () => {
    const originalLength = ALL_CARDS.length
    const originalFirstId = ALL_CARDS[0].id
    createDeck()
    expect(ALL_CARDS.length).toBe(originalLength)
    expect(ALL_CARDS[0].id).toBe(originalFirstId)
  })
})

describe('drawFromDeck', () => {
  it('should return the correct number of drawn cards', () => {
    const deck = createDeck()
    const { drawn } = drawFromDeck(deck, 5)
    expect(drawn.length).toBe(5)
  })

  it('should return the remaining deck with correct count', () => {
    const deck = createDeck()
    const originalLength = deck.length
    const drawCount = 5
    const { remaining } = drawFromDeck(deck, drawCount)
    expect(remaining.length).toBe(originalLength - drawCount)
  })

  it('should draw cards from the top of the deck', () => {
    const deck = createDeck()
    const topCards = deck.slice(0, 3).map(c => c.id)
    const { drawn } = drawFromDeck(deck, 3)
    const drawnIds = drawn.map(c => c.id)
    expect(drawnIds).toEqual(topCards)
  })

  it('should leave the rest of the deck as remaining', () => {
    const deck = createDeck()
    const restCards = deck.slice(2).map(c => c.id)
    const { remaining } = drawFromDeck(deck, 2)
    const remainingIds = remaining.map(c => c.id)
    expect(remainingIds).toEqual(restCards)
  })

  it('should handle drawing 0 cards', () => {
    const deck = createDeck()
    const { drawn, remaining } = drawFromDeck(deck, 0)
    expect(drawn.length).toBe(0)
    expect(remaining.length).toBe(deck.length)
  })

  it('should handle drawing all cards', () => {
    const deck = createDeck()
    const { drawn, remaining } = drawFromDeck(deck, deck.length)
    expect(drawn.length).toBe(deck.length)
    expect(remaining.length).toBe(0)
  })

  it('should not mutate the original deck array', () => {
    const deck = createDeck()
    const originalLength = deck.length
    drawFromDeck(deck, 5)
    expect(deck.length).toBe(originalLength)
  })

  it('should draw 2 cards (standard turn draw)', () => {
    const deck = createDeck()
    const { drawn, remaining } = drawFromDeck(deck, 2)
    expect(drawn.length).toBe(2)
    expect(remaining.length).toBe(deck.length - 2)
  })
})
