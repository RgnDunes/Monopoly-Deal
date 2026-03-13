const crypto = require('crypto')

// Simplified deck for server-side (same 107 cards as the client engine)
// We import the card data by reading the built deck structure
function createServerDeck() {
  const cards = []
  let id = 0
  const makeId = () => `card-${++id}-${crypto.randomBytes(3).toString('hex')}`

  // Money cards (20)
  const moneyCards = [
    { value: 10, count: 1 }, { value: 5, count: 2 }, { value: 4, count: 3 },
    { value: 3, count: 3 }, { value: 2, count: 5 }, { value: 1, count: 6 },
  ]
  for (const { value, count } of moneyCards) {
    for (let i = 0; i < count; i++) {
      cards.push({ id: makeId(), type: 'money', name: `$${value}M`, value })
    }
  }

  // Property cards (28) - simplified
  const properties = [
    { color: 'brown', names: ['Mediterranean Ave', 'Baltic Ave'], count: 2, value: 1, rent: [1, 2], setSize: 2 },
    { color: 'lightblue', names: ['Oriental Ave', 'Vermont Ave', 'Connecticut Ave'], count: 3, value: 1, rent: [1, 2, 3], setSize: 3 },
    { color: 'pink', names: ['St. Charles Place', 'States Ave', 'Virginia Ave'], count: 3, value: 2, rent: [1, 2, 4], setSize: 3 },
    { color: 'orange', names: ['St. James Place', 'Tennessee Ave', 'New York Ave'], count: 3, value: 2, rent: [1, 3, 5], setSize: 3 },
    { color: 'red', names: ['Kentucky Ave', 'Indiana Ave', 'Illinois Ave'], count: 3, value: 3, rent: [2, 3, 6], setSize: 3 },
    { color: 'yellow', names: ['Atlantic Ave', 'Ventnor Ave', 'Marvin Gardens'], count: 3, value: 3, rent: [2, 4, 6], setSize: 3 },
    { color: 'green', names: ['Pacific Ave', 'North Carolina Ave', 'Pennsylvania Ave'], count: 3, value: 4, rent: [2, 4, 7], setSize: 3 },
    { color: 'darkblue', names: ['Park Place', 'Boardwalk'], count: 2, value: 4, rent: [3, 8], setSize: 2 },
    { color: 'railroad', names: ['Reading RR', 'Pennsylvania RR', 'B&O RR', 'Short Line RR'], count: 4, value: 2, rent: [1, 2, 3, 4], setSize: 4 },
    { color: 'utility', names: ['Electric Company', 'Water Works'], count: 2, value: 2, rent: [1, 2], setSize: 2 },
  ]
  for (const p of properties) {
    for (let i = 0; i < p.count; i++) {
      cards.push({
        id: makeId(), type: 'property', name: p.names[i], value: p.value,
        color: p.color, rent: p.rent, setSize: p.setSize,
      })
    }
  }

  // Wild cards (11)
  const wilds = [
    { colors: ['brown', 'lightblue'], count: 1, value: 1 },
    { colors: ['pink', 'orange'], count: 2, value: 2 },
    { colors: ['red', 'yellow'], count: 2, value: 3 },
    { colors: ['green', 'darkblue'], count: 1, value: 4 },
    { colors: ['railroad', 'utility'], count: 1, value: 2 },
    { colors: ['lightblue', 'brown'], count: 1, value: 1 },
    { colors: ['railroad', 'green'], count: 1, value: 4 },
    { colors: ['lightblue', 'railroad'], count: 1, value: 4 },
  ]
  for (const w of wilds) {
    for (let i = 0; i < w.count; i++) {
      cards.push({
        id: makeId(), type: 'wild', name: `Wild ${w.colors.join('/')}`,
        value: w.value, colors: w.colors, color: w.colors[0], isRainbowWild: false,
      })
    }
  }
  // Rainbow wild (1)
  cards.push({
    id: makeId(), type: 'wild', name: 'Rainbow Wild', value: 0,
    colors: [], color: null, isRainbowWild: true,
  })

  // Action cards (35)
  const actions = [
    { name: 'Deal Breaker', value: 5, count: 2 },
    { name: 'Just Say No', value: 4, count: 3 },
    { name: 'Sly Deal', value: 3, count: 3 },
    { name: 'Forced Deal', value: 3, count: 4 },
    { name: 'Debt Collector', value: 3, count: 3 },
    { name: "It's My Birthday", value: 2, count: 3 },
    { name: 'Pass Go', value: 1, count: 10 },
    { name: 'House', value: 3, count: 3 },
    { name: 'Hotel', value: 4, count: 2 },
    { name: 'Double the Rent', value: 1, count: 2 },
  ]
  for (const a of actions) {
    for (let i = 0; i < a.count; i++) {
      cards.push({ id: makeId(), type: 'action', name: a.name, value: a.value })
    }
  }

  // Rent cards (13)
  const rents = [
    { rentColors: ['brown', 'lightblue'], count: 2, value: 1 },
    { rentColors: ['pink', 'orange'], count: 2, value: 1 },
    { rentColors: ['red', 'yellow'], count: 2, value: 1 },
    { rentColors: ['green', 'darkblue'], count: 2, value: 1 },
    { rentColors: ['railroad', 'utility'], count: 2, value: 1 },
    { rentColors: [], targetsAll: true, count: 3, value: 3 },
  ]
  for (const r of rents) {
    for (let i = 0; i < r.count; i++) {
      cards.push({
        id: makeId(), type: 'rent', name: r.targetsAll ? 'Rent (Any)' : `Rent ${r.rentColors.join('/')}`,
        value: r.value, rentColors: r.rentColors, targetsAll: !!r.targetsAll,
      })
    }
  }

  return cards
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

class Room {
  constructor(code) {
    this.code = code
    this.players = [] // { socketId, name, index }
    this.state = null
    this.maxPlayers = 5
    this.started = false
  }

  addPlayer(socketId, name) {
    if (this.started) return { error: 'Game already started' }
    if (this.players.length >= this.maxPlayers) return { error: 'Room is full' }
    const index = this.players.length
    this.players.push({ socketId, name, index })
    return { index }
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId)
  }

  getPlayerIndex(socketId) {
    const p = this.players.find(p => p.socketId === socketId)
    return p ? p.index : -1
  }

  startGame() {
    if (this.players.length < 2) return { error: 'Need at least 2 players' }
    let deck = shuffle(createServerDeck())
    const numPlayers = this.players.length
    const gamePlayers = []

    for (let i = 0; i < numPlayers; i++) {
      const hand = deck.slice(0, 5)
      deck = deck.slice(5)
      gamePlayers.push({
        id: `player-${i}`,
        name: this.players[i].name,
        hand,
        bank: [],
        properties: {},
      })
    }

    this.state = {
      id: crypto.randomBytes(4).toString('hex'),
      phase: 'playing',
      players: gamePlayers,
      deck,
      discard: [],
      currentPlayerIndex: 0,
      playsRemaining: 3,
      turnPhase: 'draw',
      winner: null,
    }
    this.started = true
    return { state: this.state }
  }

  getStateForPlayer(playerIndex) {
    if (!this.state) return null
    // Hide other players' hands
    const sanitized = {
      ...this.state,
      players: this.state.players.map((p, i) => {
        if (i === playerIndex) return p
        return { ...p, hand: p.hand.map(() => ({ id: 'hidden', type: 'hidden', name: '?', value: 0 })) }
      }),
      deck: [], // don't expose deck
    }
    return sanitized
  }

  applyAction(playerIndex, action) {
    if (!this.state) return { error: 'Game not started' }
    if (this.state.currentPlayerIndex !== playerIndex) return { error: 'Not your turn' }

    const s = this.state
    const player = s.players[playerIndex]

    switch (action.type) {
      case 'draw': {
        if (s.turnPhase !== 'draw') return { error: 'Not draw phase' }
        let deck = [...s.deck]
        let discard = [...s.discard]
        if (deck.length === 0) {
          deck = shuffle(discard)
          discard = []
        }
        const count = Math.min(2, deck.length)
        const drawn = deck.slice(0, count)
        deck = deck.slice(count)
        player.hand.push(...drawn)
        s.deck = deck
        s.discard = discard
        s.turnPhase = 'play'
        break
      }
      case 'bank': {
        if (s.turnPhase !== 'play') return { error: 'Not play phase' }
        const cardIdx = player.hand.findIndex(c => c.id === action.cardId)
        if (cardIdx === -1) return { error: 'Card not in hand' }
        const [card] = player.hand.splice(cardIdx, 1)
        player.bank.push(card)
        s.playsRemaining--
        break
      }
      case 'playProperty': {
        if (s.turnPhase !== 'play') return { error: 'Not play phase' }
        const cardIdx = player.hand.findIndex(c => c.id === action.cardId)
        if (cardIdx === -1) return { error: 'Card not in hand' }
        const [card] = player.hand.splice(cardIdx, 1)
        const color = action.color || card.color
        if (!player.properties[color]) player.properties[color] = []
        player.properties[color].push({ ...card, color })
        s.playsRemaining--
        break
      }
      case 'endTurn': {
        s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length
        s.playsRemaining = 3
        s.turnPhase = 'draw'
        break
      }
      default:
        return { error: 'Unknown action' }
    }

    return { state: this.state }
  }
}

module.exports = Room
