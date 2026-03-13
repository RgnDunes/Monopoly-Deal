import { ALL_CARDS } from './cards.js'

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function createDeck() {
  return shuffleArray(ALL_CARDS.map(card => ({ ...card })))
}

export function drawFromDeck(deck, count) {
  const drawn = deck.slice(0, count)
  const remaining = deck.slice(count)
  return { drawn, remaining }
}
