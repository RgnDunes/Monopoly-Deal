import { create } from 'zustand'
import {
  createInitialState,
  drawCards as engineDrawCards,
  bankCard as engineBankCard,
  playPropertyCard as enginePlayProperty,
  endTurn as engineEndTurn,
  discardCards as engineDiscardCards,
  resolvePassGo as enginePassGo,
  resolveDealBreaker as engineDealBreaker,
  resolveSlyDeal as engineSlyDeal,
  resolveJustSayNo as engineJSN,
  resolveHouse as engineHouse,
  resolveHotel as engineHotel,
  getCurrentPlayer,
} from '../engine/gameState.js'

const useGameStore = create((set, get) => ({
  game: null,
  myPlayerIndex: 0,
  isLocalGame: false,
  playerNames: [],

  // Initialize local game
  initLocalGame: (names) => {
    const state = createInitialState(names.length)
    // Override auto-generated names with provided names
    const players = state.players.map((p, i) => ({
      ...p,
      name: names[i] || p.name,
    }))
    set({
      game: { ...state, players },
      myPlayerIndex: 0,
      isLocalGame: true,
      playerNames: names,
    })
  },

  // Get current game state helpers
  isMyTurn: () => {
    const { game, myPlayerIndex, isLocalGame } = get()
    if (!game) return false
    if (isLocalGame) return true // in local mode, current player is always "my turn"
    return game.currentPlayerIndex === myPlayerIndex
  },

  getCurrentPlayerName: () => {
    const { game } = get()
    if (!game) return ''
    return getCurrentPlayer(game)?.name || ''
  },

  // Game actions
  drawCards: () => set(s => {
    if (!s.game) return s
    return { game: engineDrawCards(s.game) }
  }),

  bankCard: (cardId) => set(s => {
    if (!s.game) return s
    return { game: engineBankCard(s.game, cardId) }
  }),

  playPropertyCard: (cardId, color) => set(s => {
    if (!s.game) return s
    return { game: enginePlayProperty(s.game, cardId, color) }
  }),

  endTurn: () => set(s => {
    if (!s.game) return s
    return { game: engineEndTurn(s.game) }
  }),

  discardCards: (cardIds) => set(s => {
    if (!s.game) return s
    return { game: engineDiscardCards(s.game, cardIds) }
  }),

  resolvePassGo: () => set(s => {
    if (!s.game) return s
    return { game: enginePassGo(s.game) }
  }),

  resolveDealBreaker: (targetIndex, color) => set(s => {
    if (!s.game) return s
    return { game: engineDealBreaker(s.game, targetIndex, color) }
  }),

  resolveSlyDeal: (targetIndex, cardId) => set(s => {
    if (!s.game) return s
    return { game: engineSlyDeal(s.game, targetIndex, cardId) }
  }),

  resolveJustSayNo: (jsnCount) => {
    const { game } = get()
    if (!game) return { cancelled: false }
    const result = engineJSN(game, { jsnCount })
    set({ game: result.state })
    return { cancelled: result.cancelled }
  },

  resolveHouse: (cardId, color) => set(s => {
    if (!s.game) return s
    return { game: engineHouse(s.game, cardId, color) }
  }),

  resolveHotel: (cardId, color) => set(s => {
    if (!s.game) return s
    return { game: engineHotel(s.game, cardId, color) }
  }),

  // Set player index for multiplayer
  setMyPlayerIndex: (index) => set({ myPlayerIndex: index }),

  // Update game state directly (for multiplayer sync)
  setGame: (game) => set({ game }),

  // Reset
  resetGame: () => set({ game: null, myPlayerIndex: 0, isLocalGame: false, playerNames: [] }),
}))

export default useGameStore
