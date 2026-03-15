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
  playActionCard as enginePlayAction,
  resolveRent as engineResolveRent,
  resolveDebtCollector as engineDebtCollector,
  resolveBirthday as engineBirthday,
  resolvePayDebt as enginePayDebt,
  resolveForcedDeal as engineForcedDeal,
  moveWild as engineMoveWild,
  removeHouse as engineRemoveHouse,
  removeHotel as engineRemoveHotel,
  getCurrentPlayer,
} from '../engine/gameState.js'

const STORAGE_KEY = 'monopoly-deal-game'
const SAVE_VERSION = 2

function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    // Reject saves from older versions to avoid stale/incompatible state
    if (parsed?.version !== SAVE_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    // Migrate: ensure players have houses/hotels objects
    if (parsed?.game?.players) {
      for (const p of parsed.game.players) {
        if (!p.houses) p.houses = {}
        if (!p.hotels) p.hotels = {}
      }
    }
    return parsed
  } catch {
    return null
  }
}

function saveState(state) {
  try {
    const toSave = {
      version: SAVE_VERSION,
      game: state.game,
      myPlayerIndex: state.myPlayerIndex,
      isLocalGame: state.isLocalGame,
      playerNames: state.playerNames,
      pendingPayments: state.pendingPayments,
      pendingAction: state.pendingAction,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* ignore storage errors */ }
}

const saved = loadSavedState()

const useGameStore = create((set, get) => ({
  game: saved?.game || null,
  myPlayerIndex: saved?.myPlayerIndex || 0,
  isLocalGame: saved?.isLocalGame || false,
  playerNames: saved?.playerNames || [],
  pendingPayments: saved?.pendingPayments || [],
  pendingAction: saved?.pendingAction || null,

  // Initialize local game
  initLocalGame: (names) => {
    const state = createInitialState(names.length)
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
    if (isLocalGame) return true
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

  executeDealBreaker: (actionCardId, targetIndex, color) => set(s => {
    if (!s.game) return s
    const afterPlay = enginePlayAction(s.game, actionCardId)
    const afterSteal = engineDealBreaker(afterPlay, targetIndex, color)
    return { game: afterSteal }
  }),

  executeSlyDeal: (actionCardId, targetIndex, cardId) => set(s => {
    if (!s.game) return s
    const afterPlay = enginePlayAction(s.game, actionCardId)
    const afterSteal = engineSlyDeal(afterPlay, targetIndex, cardId)
    return { game: afterSteal }
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

  executeForcedDeal: (actionCardId, targetIndex, yourCardId, theirCardId) => set(s => {
    if (!s.game) return s
    const afterPlay = enginePlayAction(s.game, actionCardId)
    const afterSwap = engineForcedDeal(afterPlay, targetIndex, yourCardId, theirCardId)
    return { game: afterSwap }
  }),

  moveWild: (cardId, fromColor, toColor) => set(s => {
    if (!s.game) return s
    return { game: engineMoveWild(s.game, cardId, fromColor, toColor) }
  }),

  removeHouse: (color) => set(s => {
    if (!s.game) return s
    return { game: engineRemoveHouse(s.game, color) }
  }),

  removeHotel: (color) => set(s => {
    if (!s.game) return s
    return { game: engineRemoveHotel(s.game, color) }
  }),

  playActionCard: (cardId) => set(s => {
    if (!s.game) return s
    return { game: enginePlayAction(s.game, cardId) }
  }),

  startRent: (cardId, color, doubled, doubleCardId) => {
    const { game } = get()
    if (!game) return
    let newState = enginePlayAction(game, cardId)
    if (doubled && doubleCardId) {
      newState = enginePlayAction(newState, doubleCardId)
    }
    const opponents = newState.players
      .map((_, i) => i)
      .filter(i => i !== newState.currentPlayerIndex)
    const { pendingPayments } = engineResolveRent(newState, color, opponents, doubled || false)
    set({ game: newState, pendingPayments })
  },

  startDebtCollector: (cardId, targetIndex) => {
    const { game } = get()
    if (!game) return
    const newState = enginePlayAction(game, cardId)
    const { pendingPayment } = engineDebtCollector(newState, targetIndex)
    set({ game: newState, pendingPayments: [pendingPayment] })
  },

  startBirthday: (cardId) => {
    const { game } = get()
    if (!game) return
    const newState = enginePlayAction(game, cardId)
    const { pendingPayments } = engineBirthday(newState)
    set({ game: newState, pendingPayments })
  },

  processPayment: (payerIndex, collectorIndex, cardIds) => set(s => {
    if (!s.game) return s
    const newGame = enginePayDebt(s.game, payerIndex, collectorIndex, cardIds)
    const remaining = s.pendingPayments.slice(1)
    return { game: newGame, pendingPayments: remaining }
  }),

  skipPayment: () => set(s => ({
    pendingPayments: s.pendingPayments.slice(1),
  })),

  // Initiate a targeted action with JSN check
  initTargetedAction: (actionCardId, actionType, params) => {
    const { game } = get()
    if (!game) return
    const afterPlay = enginePlayAction(game, actionCardId)
    const targetIndex = params.targetIndex
    const target = afterPlay.players[targetIndex]
    const hasJSN = target.hand.some(c => c.name?.toLowerCase() === 'just say no')

    if (hasJSN) {
      set({
        game: afterPlay,
        pendingAction: {
          type: actionType,
          ...params,
          attackerIndex: afterPlay.currentPlayerIndex,
          jsnChainCount: 0,
        },
      })
    } else {
      let result
      switch (actionType) {
        case 'dealBreaker':
          result = engineDealBreaker(afterPlay, params.targetIndex, params.color)
          break
        case 'slyDeal':
          result = engineSlyDeal(afterPlay, params.targetIndex, params.cardId)
          break
        case 'forcedDeal':
          result = engineForcedDeal(afterPlay, params.targetIndex, params.yourCardId, params.theirCardId)
          break
        default:
          result = afterPlay
      }
      set({ game: result })
    }
  },

  // Accept the pending action (current responder doesn't play JSN)
  acceptPendingAction: () => {
    const { pendingAction, game } = get()
    if (!pendingAction || !game) return

    const isTargetTurn = pendingAction.jsnChainCount % 2 === 0
    if (isTargetTurn) {
      let result
      switch (pendingAction.type) {
        case 'dealBreaker':
          result = engineDealBreaker(game, pendingAction.targetIndex, pendingAction.color)
          break
        case 'slyDeal':
          result = engineSlyDeal(game, pendingAction.targetIndex, pendingAction.cardId)
          break
        case 'forcedDeal':
          result = engineForcedDeal(game, pendingAction.targetIndex, pendingAction.yourCardId, pendingAction.theirCardId)
          break
        default:
          result = game
      }
      set({ game: result, pendingAction: null })
    } else {
      set({ pendingAction: null })
    }
  },

  // Play JSN in the chain
  playJSNInChain: () => {
    const { pendingAction, game } = get()
    if (!pendingAction || !game) return

    const isTargetTurn = pendingAction.jsnChainCount % 2 === 0
    const responderIndex = isTargetTurn ? pendingAction.targetIndex : pendingAction.attackerIndex
    const responder = game.players[responderIndex]

    const jsnCard = responder.hand.find(c => c.name?.toLowerCase() === 'just say no')
    if (!jsnCard) return

    const updatedPlayers = game.players.map((p, i) => {
      if (i !== responderIndex) return p
      return { ...p, hand: p.hand.filter(c => c.id !== jsnCard.id) }
    })
    const newGame = { ...game, players: updatedPlayers, discard: [...game.discard, jsnCard] }
    const newCount = pendingAction.jsnChainCount + 1

    const nextIsTarget = newCount % 2 === 0
    const nextResponderIndex = nextIsTarget ? pendingAction.targetIndex : pendingAction.attackerIndex
    const nextResponder = newGame.players[nextResponderIndex]
    const nextHasJSN = nextResponder.hand.some(c => c.name?.toLowerCase() === 'just say no')

    if (nextHasJSN) {
      set({
        game: newGame,
        pendingAction: { ...pendingAction, jsnChainCount: newCount },
      })
    } else {
      if (newCount % 2 === 1) {
        set({ game: newGame, pendingAction: null })
      } else {
        let result
        switch (pendingAction.type) {
          case 'dealBreaker':
            result = engineDealBreaker(newGame, pendingAction.targetIndex, pendingAction.color)
            break
          case 'slyDeal':
            result = engineSlyDeal(newGame, pendingAction.targetIndex, pendingAction.cardId)
            break
          case 'forcedDeal':
            result = engineForcedDeal(newGame, pendingAction.targetIndex, pendingAction.yourCardId, pendingAction.theirCardId)
            break
          default:
            result = newGame
        }
        set({ game: result, pendingAction: null })
      }
    }
  },

  // Use JSN to cancel a pending payment
  useJSNForPayment: (payerIndex) => {
    const { game, pendingPayments } = get()
    if (!game) return
    const payer = game.players[payerIndex]
    const jsnCard = payer.hand.find(c => c.name?.toLowerCase() === 'just say no')
    if (!jsnCard) return

    const updatedPlayers = game.players.map((p, i) => {
      if (i !== payerIndex) return p
      return { ...p, hand: p.hand.filter(c => c.id !== jsnCard.id) }
    })
    set({
      game: { ...game, players: updatedPlayers, discard: [...game.discard, jsnCard] },
      pendingPayments: pendingPayments.slice(1),
    })
  },

  setMyPlayerIndex: (index) => set({ myPlayerIndex: index }),
  setGame: (game) => set({ game }),

  resetGame: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ game: null, myPlayerIndex: 0, isLocalGame: false, playerNames: [], pendingPayments: [], pendingAction: null })
  },
}))

// Persist game state to localStorage on every change
useGameStore.subscribe(saveState)

export default useGameStore
