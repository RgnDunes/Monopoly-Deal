import { useCallback } from 'react'
import useGameStore from '../../store/gameStore.js'
import useUIStore from '../../store/uiStore.js'
import PlayerZone from './PlayerZone.jsx'
import CenterPile from './CenterPile.jsx'
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
  const addToast = useUIStore(s => s.addToast)
  const showModal = useUIStore(s => s.showModal)

  const handleActionCard = useCallback((card) => {
    const name = card.name.toLowerCase()
    if (name === 'pass go') {
      bankCard(card.id)
      addToast('Banked Pass Go as money', 'success')
    } else if (name === 'deal breaker') {
      showModal('targetSelect', { action: 'dealBreaker', cardId: card.id })
    } else if (name === 'sly deal') {
      showModal('targetSelect', { action: 'slyDeal', cardId: card.id })
    } else if (name === 'forced deal') {
      showModal('targetSelect', { action: 'forcedDeal', cardId: card.id })
    } else if (name === 'debt collector') {
      showModal('targetSelect', { action: 'debtCollector', cardId: card.id })
    } else if (name === "it's my birthday") {
      showModal('targetSelect', { action: 'birthday', cardId: card.id })
    } else if (name === 'just say no') {
      bankCard(card.id)
      addToast('Banked Just Say No as money', 'success')
    } else if (name === 'house') {
      showModal('targetSelect', { action: 'house', cardId: card.id })
    } else if (name === 'hotel') {
      showModal('targetSelect', { action: 'hotel', cardId: card.id })
    } else if (name === 'double the rent') {
      bankCard(card.id)
      addToast('Banked Double the Rent as money', 'success')
    } else {
      bankCard(card.id)
      addToast(`Banked ${card.name} as money`, 'success')
    }
  }, [bankCard, showModal, addToast])

  const handleRentCard = useCallback((card) => {
    showModal('targetSelect', { action: 'rent', cardId: card.id, rentColors: card.rentColors, targetsAll: card.targetsAll })
  }, [showModal])

  const handleCardClick = useCallback((card) => {
    if (!game || game.turnPhase !== 'play' || game.playsRemaining <= 0) return

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

  const handleDraw = useCallback(() => {
    if (!game) return
    drawCards()
    addToast(`${game.players[game.currentPlayerIndex].name} drew 2 cards`, 'info')
  }, [game, drawCards, addToast])

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
            <button className={styles.drawButton} onClick={handleDraw}>
              Draw Cards
            </button>
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
          <PropertyArea properties={currentPlayer.properties} />
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
