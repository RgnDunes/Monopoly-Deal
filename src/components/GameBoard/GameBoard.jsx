import { useCallback, useEffect, useRef } from 'react'
import useGameStore from '../../store/gameStore.js'
import useUIStore from '../../store/uiStore.js'
import PlayerZone from './PlayerZone.jsx'
import CenterPile from './CenterPile.jsx'
import TurnIndicator from '../HUD/TurnIndicator.jsx'
import Hand from '../Hand/Hand.jsx'
import Bank from '../Bank/Bank.jsx'
import PropertyArea from '../PropertyArea/PropertyArea.jsx'
import styles from './GameBoard.module.css'

function GameBoard() {
  const game = useGameStore(s => s.game)
  const isLocalGame = useGameStore(s => s.isLocalGame)
  const drawCards = useGameStore(s => s.drawCards)
  const bankCard = useGameStore(s => s.bankCard)
  const playPropertyCard = useGameStore(s => s.playPropertyCard)
  const endTurn = useGameStore(s => s.endTurn)
  const removeHouse = useGameStore(s => s.removeHouse)
  const removeHotel = useGameStore(s => s.removeHotel)
  const addToast = useUIStore(s => s.addToast)
  const showModal = useUIStore(s => s.showModal)

  const handleActionCard = useCallback((card) => {
    const name = card.name.toLowerCase()
    if (name === 'pass go') {
      showModal('actionChoice', { card })
    } else if (name === 'deal breaker') {
      showModal('targetSelect', { action: 'dealBreaker', cardId: card.id })
    } else if (name === 'sly deal') {
      showModal('targetSelect', { action: 'slyDeal', cardId: card.id })
    } else if (name === 'forced deal') {
      showModal('targetSelect', { action: 'forcedDeal', cardId: card.id })
    } else if (name === 'debt collector') {
      showModal('targetSelect', { action: 'debtCollector', cardId: card.id })
    } else if (name.includes('birthday')) {
      showModal('actionChoice', { card })
    } else if (name === 'just say no') {
      showModal('actionChoice', { card, subAction: 'justSayNo' })
    } else if (name === 'house') {
      showModal('targetSelect', { action: 'house', cardId: card.id })
    } else if (name === 'hotel') {
      showModal('targetSelect', { action: 'hotel', cardId: card.id })
    } else if (name === 'double the rent') {
      const cp = game.players[game.currentPlayerIndex]
      const rentCards = cp.hand.filter(c => c.type === 'rent' && c.id !== card.id)
      if (rentCards.length > 0 && game.playsRemaining >= 2) {
        showModal('actionChoice', { card, subAction: 'doubleTheRent', rentCards })
      } else {
        bankCard(card.id)
        addToast('Banked Double the Rent as $1M (no rent cards or not enough plays)', 'info')
      }
    } else {
      bankCard(card.id)
      addToast(`Banked ${card.name} as money`, 'success')
    }
  }, [bankCard, showModal, addToast, game])

  const handleRentCard = useCallback((card) => {
    showModal('targetSelect', { action: 'rent', cardId: card.id, rentColors: card.rentColors, targetsAll: card.targetsAll })
  }, [showModal])

  const handleCardClick = useCallback((card) => {
    if (!game) return
    if (game.turnPhase === 'draw') {
      addToast('Draw your cards first!', 'warning')
      return
    }
    if (game.playsRemaining <= 0) {
      addToast('No plays left — end your turn or discard', 'warning')
      return
    }

    const currentPlayer = game.players[game.currentPlayerIndex]
    if (card.type === 'money') {
      bankCard(card.id)
      addToast(`Banked ${card.name}`, 'success')
    } else if (card.type === 'property') {
      playPropertyCard(card.id, card.color)
      addToast(`Played ${card.name}`, 'success')
    } else if (card.type === 'wild') {
      if (card.isRainbowWild) {
        const existingColors = Object.keys(currentPlayer.properties)
        showModal('wildColor', { cardId: card.id, colors: existingColors.length > 0 ? existingColors : ['brown', 'lightblue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkblue', 'railroad', 'utility'] })
      } else {
        showModal('wildColor', { cardId: card.id, colors: card.colors })
      }
    } else if (card.type === 'action') {
      handleActionCard(card)
    } else if (card.type === 'rent') {
      handleRentCard(card)
    }
  }, [game, bankCard, playPropertyCard, showModal, addToast, handleActionCard, handleRentCard])

  // Click on a property card in the property area (for moving wilds)
  const handlePropertyCardClick = useCallback((card, fromColor) => {
    if (!game || game.turnPhase !== 'play') return
    if (card.type === 'wild') {
      showModal('targetSelect', { action: 'moveWild', card, fromColor })
    }
  }, [game, showModal])

  // Click on house/hotel badge to bank it
  const handleEnhancementClick = useCallback((color, type) => {
    if (!game || game.turnPhase !== 'play') return
    if (type === 'house') {
      removeHouse(color)
      addToast(`Banked house from ${color} as $3M`, 'success')
    } else if (type === 'hotel') {
      removeHotel(color)
      addToast(`Banked hotel from ${color} as $4M`, 'success')
    }
  }, [game, removeHouse, removeHotel, addToast])

  const handleDraw = useCallback(() => {
    if (!game) return
    drawCards()
    addToast(`${game.players[game.currentPlayerIndex].name} drew 2 cards`, 'info')
  }, [game, drawCards, addToast])

  // Auto-draw when it's a human player's draw phase
  const autoDrawRef = useRef(null)
  useEffect(() => {
    if (!game || game.turnPhase !== 'draw' || game.winner) return
    const currentPlayer = game.players[game.currentPlayerIndex]
    const isBot = currentPlayer.name.toLowerCase().startsWith('bot') ||
                  currentPlayer.name.toLowerCase().startsWith('cpu')
    if (isBot) return

    autoDrawRef.current = setTimeout(() => {
      drawCards()
      useUIStore.getState().addToast(`${currentPlayer.name} drew 2 cards`, 'info')
    }, 600)

    return () => clearTimeout(autoDrawRef.current)
  }, [game?.turnPhase, game?.currentPlayerIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-end turn when plays remaining hits 0
  const autoEndRef = useRef(null)
  useEffect(() => {
    if (!game || game.turnPhase !== 'play' || game.playsRemaining > 0 || game.winner) return
    const pendingPayments = useGameStore.getState().pendingPayments
    if (pendingPayments.length > 0) return
    const currentPlayer = game.players[game.currentPlayerIndex]
    const isBot = currentPlayer.name.toLowerCase().startsWith('bot') ||
                  currentPlayer.name.toLowerCase().startsWith('cpu')
    if (isBot) return

    autoEndRef.current = setTimeout(() => {
      const g = useGameStore.getState().game
      if (!g || g.playsRemaining > 0 || g.winner) return
      const cp = g.players[g.currentPlayerIndex]
      if (cp.hand.length > 7) {
        useUIStore.getState().showModal('discard', { needToDiscard: cp.hand.length - 7 })
        return
      }
      if (useGameStore.getState().isLocalGame) {
        const nextIndex = (g.currentPlayerIndex + 1) % g.players.length
        useUIStore.getState().showPassDeviceModal(g.players[nextIndex].name)
      }
      useGameStore.getState().endTurn()
    }, 800)

    return () => clearTimeout(autoEndRef.current)
  }, [game?.turnPhase, game?.playsRemaining, game?.currentPlayerIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEndTurn = useCallback(() => {
    if (!game) return
    const currentPlayer = game.players[game.currentPlayerIndex]
    if (currentPlayer.hand.length > 7) {
      showModal('discard', { needToDiscard: currentPlayer.hand.length - 7 })
      return
    }
    if (isLocalGame) {
      const nextIndex = (game.currentPlayerIndex + 1) % game.players.length
      const nextName = game.players[nextIndex].name
      useUIStore.getState().showPassDeviceModal(nextName)
    }
    endTurn()
  }, [game, isLocalGame, endTurn, showModal])

  if (!game) return null

  const currentPlayer = game.players[game.currentPlayerIndex]
  const opponents = game.players.filter((_, i) => i !== game.currentPlayerIndex)
  const isDrawPhase = game.turnPhase === 'draw'
  const isPlayPhase = game.turnPhase === 'play'

  return (
    <div className={styles.board}>
      <div className={styles.topBar}>
        <TurnIndicator />
      </div>
      <div className={styles.opponentsRow}>
        {opponents.map(player => (
          <PlayerZone key={player.id} player={player} isOpponent />
        ))}
      </div>

      <div className={styles.centerArea}>
        <CenterPile
          deckCount={game.deck.length}
          topDiscard={game.discard[game.discard.length - 1]}
          isDrawPhase={isDrawPhase}
          onDraw={handleDraw}
        />
        <div className={styles.actionBar}>
          {isDrawPhase && (
            <div className={styles.drawingLabel}>Drawing cards...</div>
          )}
          {isPlayPhase && (
            <button className={styles.endTurnButton} onClick={handleEndTurn}>
              End Turn ({game.playsRemaining} plays left)
            </button>
          )}
        </div>
      </div>

      <div className={styles.myArea}>
        <div className={styles.myProperties}>
          <PropertyArea
            properties={currentPlayer.properties}
            player={currentPlayer}
            onCardClick={handlePropertyCardClick}
            onEnhancementClick={handleEnhancementClick}
          />
        </div>
        <div className={styles.myBankAndHand}>
          <div className={styles.myBankWrapper}>
            <Bank cards={currentPlayer.bank} />
          </div>
          <div className={styles.myHandWrapper}>
            <Hand
              cards={currentPlayer.hand}
              playsRemaining={game.playsRemaining}
              isMyTurn={isPlayPhase}
              onCardClick={handleCardClick}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameBoard
