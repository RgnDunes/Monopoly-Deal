import { useState } from 'react'
import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import useGameStore from '../../store/gameStore.js'
import { calculateRent } from '../../engine/rent.js'
import { isSetComplete, hasHouse } from '../../engine/properties.js'
import styles from './Modals.module.css'

function TargetSelectModal() {
  const activeModal = useUIStore(s => s.activeModal)
  const modalData = useUIStore(s => s.modalData)
  const closeModal = useUIStore(s => s.closeModal)
  const addToast = useUIStore(s => s.addToast)
  const game = useGameStore(s => s.game)
  const bankCard = useGameStore(s => s.bankCard)
  const resolveDealBreaker = useGameStore(s => s.resolveDealBreaker)
  const resolveSlyDeal = useGameStore(s => s.resolveSlyDeal)
  const resolveHouse = useGameStore(s => s.resolveHouse)
  const resolveHotel = useGameStore(s => s.resolveHotel)
  const playActionCard = useGameStore(s => s.playActionCard)
  const resolveForcedDeal = useGameStore(s => s.resolveForcedDeal)
  const startRent = useGameStore(s => s.startRent)
  const startDebtCollector = useGameStore(s => s.startDebtCollector)
  const startBirthday = useGameStore(s => s.startBirthday)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [theirCardId, setTheirCardId] = useState(null)

  if (activeModal !== 'targetSelect' || !modalData || !game) return null

  const action = modalData.action
  const opponents = game.players
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => p.index !== game.currentPlayerIndex)

  const handlePlayerSelect = (playerIndex) => {
    if (action === 'debtCollector') {
      startDebtCollector(modalData.cardId, playerIndex)
      addToast(`Debt Collector! ${game.players[playerIndex].name} owes $5M`, 'info')
      closeModal()
    } else if (action === 'birthday') {
      startBirthday(modalData.cardId)
      addToast("It's your birthday! Everyone owes $2M", 'info')
      closeModal()
    } else {
      setSelectedPlayer(playerIndex)
    }
  }

  const handleColorSelect = (color) => {
    if (action === 'dealBreaker' && selectedPlayer !== null) {
      playActionCard(modalData.cardId)
      resolveDealBreaker(selectedPlayer, color)
      addToast(`Deal Breaker! Stole ${color} set`, 'success')
      closeModal()
    } else if (action === 'house') {
      resolveHouse(modalData.cardId, color)
      addToast(`Placed house on ${color}`, 'success')
      closeModal()
    } else if (action === 'hotel') {
      resolveHotel(modalData.cardId, color)
      addToast(`Placed hotel on ${color}`, 'success')
      closeModal()
    } else if (action === 'rent') {
      const currentPlayer = game.players[game.currentPlayerIndex]
      const rent = calculateRent(currentPlayer.properties, color)
      if (rent === 0) {
        addToast(`You have no ${color} properties — can't charge rent!`, 'warning')
        return
      }
      startRent(modalData.cardId, color)
      addToast(`Charging $${rent}M rent for ${color}!`, 'success')
      closeModal()
    }
  }

  const handleSlyDealCard = (cardId) => {
    if (selectedPlayer !== null) {
      resolveSlyDeal(selectedPlayer, cardId)
      bankCard(modalData.cardId)
      addToast('Sly Deal! Stole a property', 'success')
      closeModal()
    }
  }

  const getTitle = () => {
    switch (action) {
      case 'dealBreaker': return 'Deal Breaker'
      case 'slyDeal': return 'Sly Deal'
      case 'forcedDeal': return 'Forced Deal'
      case 'debtCollector': return 'Debt Collector'
      case 'birthday': return "It's My Birthday!"
      case 'house': return 'Place House'
      case 'hotel': return 'Place Hotel'
      case 'rent': return 'Charge Rent'
      default: return 'Select Target'
    }
  }

  // For house/hotel, show only eligible complete sets
  if (action === 'house' || action === 'hotel') {
    const currentPlayer = game.players[game.currentPlayerIndex]
    const eligibleSets = Object.entries(currentPlayer.properties)
      .filter(([color, cards]) => {
        if (!cards || cards.length === 0) return false
        if (!isSetComplete(currentPlayer.properties, color)) return false
        if (action === 'hotel' && !hasHouse(currentPlayer.properties, color)) return false
        return true
      })

    return (
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={closeModal}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.modalTitle}>{getTitle()}</div>
          {eligibleSets.length > 0 ? (
            <>
              <div className={styles.modalSubtitle}>
                {action === 'house' ? 'Choose a complete set to add a house' : 'Choose a set with a house to add a hotel'}
              </div>
              <div className={styles.playerList}>
                {eligibleSets.map(([color]) => (
                  <button
                    key={color}
                    className={styles.playerButton}
                    onClick={() => handleColorSelect(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.modalSubtitle}>
              {action === 'house'
                ? 'You need a complete property set to place a house. Bank it as money instead.'
                : 'You need a complete set with a house to place a hotel. Bank it as money instead.'}
            </div>
          )}
          <button className={styles.cancelButton} onClick={() => {
            if (eligibleSets.length === 0) {
              bankCard(modalData.cardId)
              addToast(`No eligible sets — banked ${action === 'house' ? 'House' : 'Hotel'} as money`, 'info')
            }
            closeModal()
          }}>
            {eligibleSets.length === 0 ? 'Bank as Money' : 'Cancel'}
          </button>
        </motion.div>
      </motion.div>
    )
  }

  // For rent, show color selection — only colors the player owns properties for
  if (action === 'rent') {
    const rentColors = modalData.rentColors || []
    const currentPlayer = game.players[game.currentPlayerIndex]
    const ownedColors = rentColors.filter(color =>
      currentPlayer.properties[color] && currentPlayer.properties[color].length > 0
    )

    return (
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={closeModal}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.modalTitle}>{getTitle()}</div>
          {ownedColors.length > 0 ? (
            <>
              <div className={styles.modalSubtitle}>Choose a color to charge rent for</div>
              <div className={styles.playerList}>
                {ownedColors.map(color => {
                  const rent = calculateRent(currentPlayer.properties, color)
                  return (
                    <button
                      key={color}
                      className={styles.playerButton}
                      onClick={() => handleColorSelect(color)}
                    >
                      {color} — ${rent}M rent
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className={styles.modalSubtitle}>
              You don&apos;t own any matching properties. Bank it as money instead.
            </div>
          )}
          <button className={styles.cancelButton} onClick={() => {
            if (ownedColors.length === 0) {
              bankCard(modalData.cardId)
              addToast(`No matching properties — banked rent card as $${game.players[game.currentPlayerIndex].hand.find(c => c.id === modalData.cardId)?.value || 1}M`, 'info')
            }
            closeModal()
          }}>
            {ownedColors.length === 0 ? 'Bank as Money' : 'Cancel'}
          </button>
        </motion.div>
      </motion.div>
    )
  }

  // Step 1: Select player
  if (selectedPlayer === null) {
    return (
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={closeModal}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.modalTitle}>{getTitle()}</div>
          <div className={styles.modalSubtitle}>Choose a player</div>
          <div className={styles.playerList}>
            {opponents.map(p => (
              <button
                key={p.index}
                className={styles.playerButton}
                onClick={() => handlePlayerSelect(p.index)}
              >
                {p.name}
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: '8px' }}>
                  {Object.keys(p.properties).length} sets, {p.bank.length} bank cards
                </span>
              </button>
            ))}
          </div>
          <button className={styles.cancelButton} onClick={closeModal}>Cancel (bank as money)</button>
        </motion.div>
      </motion.div>
    )
  }

  // Step 2: For deal breaker, select color set
  if (action === 'dealBreaker') {
    const target = game.players[selectedPlayer]
    const sets = Object.entries(target.properties).filter(([color, cards]) =>
      cards && cards.length > 0 && isSetComplete(target.properties, color)
    )
    if (sets.length === 0) {
      return (
        <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
          <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>{target.name} has no complete sets to steal</div>
            <button className={styles.cancelButton} onClick={() => setSelectedPlayer(null)}>Pick another player</button>
          </motion.div>
        </motion.div>
      )
    }
    return (
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={closeModal}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.modalTitle}>Choose a set to steal</div>
          <div className={styles.playerList}>
            {sets.map(([color, cards]) => (
              <button
                key={color}
                className={styles.playerButton}
                onClick={() => handleColorSelect(color)}
              >
                {color} ({cards.length} cards)
              </button>
            ))}
          </div>
          <button className={styles.cancelButton} onClick={() => setSelectedPlayer(null)}>Back</button>
        </motion.div>
      </motion.div>
    )
  }

  // Step 2: For sly deal, select card
  if (action === 'slyDeal') {
    const target = game.players[selectedPlayer]
    const allCards = Object.entries(target.properties).flatMap(([color, cards]) =>
      cards.map(c => ({ ...c, displayColor: color }))
    )
    return (
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={closeModal}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.modalTitle}>Choose a card to steal</div>
          <div className={styles.playerList}>
            {allCards.map(card => (
              <button
                key={card.id}
                className={styles.playerButton}
                onClick={() => handleSlyDealCard(card.id)}
              >
                {card.name} ({card.displayColor})
              </button>
            ))}
          </div>
          <button className={styles.cancelButton} onClick={() => setSelectedPlayer(null)}>Back</button>
        </motion.div>
      </motion.div>
    )
  }

  // Step 2: For forced deal, select their card
  if (action === 'forcedDeal' && theirCardId === null) {
    const target = game.players[selectedPlayer]
    const allCards = Object.entries(target.properties).flatMap(([color, cards]) =>
      cards.map(c => ({ ...c, displayColor: color }))
    )
    if (allCards.length === 0) {
      return (
        <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
          <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>{target.name} has no properties</div>
            <button className={styles.cancelButton} onClick={() => setSelectedPlayer(null)}>Back</button>
          </motion.div>
        </motion.div>
      )
    }
    return (
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>Choose their property to take</div>
          <div className={styles.playerList}>
            {allCards.map(card => (
              <button key={card.id} className={styles.playerButton} onClick={() => setTheirCardId(card.id)}>
                {card.name} ({card.displayColor})
              </button>
            ))}
          </div>
          <button className={styles.cancelButton} onClick={() => setSelectedPlayer(null)}>Back</button>
        </motion.div>
      </motion.div>
    )
  }

  // Step 3: For forced deal, select your card to give
  if (action === 'forcedDeal' && theirCardId !== null) {
    const currentPlayer = game.players[game.currentPlayerIndex]
    const myCards = Object.entries(currentPlayer.properties).flatMap(([color, cards]) =>
      cards.map(c => ({ ...c, displayColor: color }))
    )
    if (myCards.length === 0) {
      return (
        <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
          <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>You have no properties to swap</div>
            <button className={styles.cancelButton} onClick={() => { setTheirCardId(null); setSelectedPlayer(null) }}>Back</button>
          </motion.div>
        </motion.div>
      )
    }
    return (
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>Choose your property to give</div>
          <div className={styles.playerList}>
            {myCards.map(card => (
              <button key={card.id} className={styles.playerButton} onClick={() => {
                playActionCard(modalData.cardId)
                resolveForcedDeal(selectedPlayer, card.id, theirCardId)
                addToast('Forced Deal! Swapped properties', 'success')
                setTheirCardId(null)
                closeModal()
              }}>
                {card.name} ({card.displayColor})
              </button>
            ))}
          </div>
          <button className={styles.cancelButton} onClick={() => setTheirCardId(null)}>Back</button>
        </motion.div>
      </motion.div>
    )
  }

  return null
}

export default TargetSelectModal
