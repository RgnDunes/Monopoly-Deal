import { useState } from 'react'
import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import useGameStore from '../../store/gameStore.js'
import { calculateRent } from '../../engine/rent.js'
import { isSetComplete, hasHouse, hasHotel } from '../../engine/properties.js'
import styles from './Modals.module.css'

function TargetSelectModal() {
  const activeModal = useUIStore(s => s.activeModal)
  const modalData = useUIStore(s => s.modalData)
  const closeModal = useUIStore(s => s.closeModal)
  const addToast = useUIStore(s => s.addToast)
  const game = useGameStore(s => s.game)
  const bankCard = useGameStore(s => s.bankCard)
  const executeDealBreaker = useGameStore(s => s.executeDealBreaker)
  const executeSlyDeal = useGameStore(s => s.executeSlyDeal)
  const executeForcedDeal = useGameStore(s => s.executeForcedDeal)
  const resolveHouse = useGameStore(s => s.resolveHouse)
  const resolveHotel = useGameStore(s => s.resolveHotel)
  const moveWild = useGameStore(s => s.moveWild)
  const startRent = useGameStore(s => s.startRent)
  const startDebtCollector = useGameStore(s => s.startDebtCollector)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [theirCardId, setTheirCardId] = useState(null)

  if (activeModal !== 'targetSelect' || !modalData || !game) return null

  const action = modalData.action
  const currentPlayer = game.players[game.currentPlayerIndex]
  const opponents = game.players
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => p.index !== game.currentPlayerIndex)

  const handleBankInstead = () => {
    const card = currentPlayer.hand.find(c => c.id === modalData.cardId)
    bankCard(modalData.cardId)
    addToast(`Banked ${card?.name || 'card'} as $${card?.value || 1}M`, 'info')
    closeModal()
  }

  const getTitle = () => {
    switch (action) {
      case 'dealBreaker': return 'Deal Breaker'
      case 'slyDeal': return 'Sly Deal'
      case 'forcedDeal': return 'Forced Deal'
      case 'debtCollector': return 'Debt Collector'
      case 'house': return 'Place House'
      case 'hotel': return 'Place Hotel'
      case 'rent': return 'Charge Rent'
      case 'moveWild': return 'Move Wild Card'
      default: return 'Select Target'
    }
  }

  // Helper: calculate opponent's total payable assets
  const getPayableTotal = (player) => {
    const bankTotal = player.bank.reduce((sum, c) => sum + (c.value || 0), 0)
    const propTotal = Object.values(player.properties).flat().reduce((sum, c) => sum + (c.value || 0), 0)
    return bankTotal + propTotal
  }

  // Move wild card between property sets (free action)
  if (action === 'moveWild') {
    const card = modalData.card
    const validColors = card.isRainbowWild
      ? ['brown', 'lightblue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkblue', 'railroad', 'utility']
      : (card.colors || [])
    const targetColors = validColors.filter(c => c !== modalData.fromColor)

    return (
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>{getTitle()}</div>
          <div className={styles.modalSubtitle}>Move to which color set?</div>
          <div className={styles.playerList}>
            {targetColors.map(color => (
              <button
                key={color}
                className={styles.playerButton}
                onClick={() => {
                  moveWild(card.id, modalData.fromColor, color)
                  addToast(`Moved wild to ${color} (free action)`, 'success')
                  closeModal()
                }}
              >
                {color}
              </button>
            ))}
          </div>
          <button className={styles.cancelButton} onClick={closeModal}>Cancel</button>
        </motion.div>
      </motion.div>
    )
  }

  // For house/hotel, show only eligible complete sets
  if (action === 'house' || action === 'hotel') {
    const eligibleSets = Object.entries(currentPlayer.properties)
      .filter(([color, cards]) => {
        if (!cards || cards.length === 0) return false
        if (color === 'railroad' || color === 'utility') return false
        if (!isSetComplete(currentPlayer.properties, color)) return false
        if (action === 'house' && hasHouse(currentPlayer.properties, color)) return false
        if (action === 'house' && hasHotel(currentPlayer.properties, color)) return false
        if (action === 'hotel' && !hasHouse(currentPlayer.properties, color)) return false
        if (action === 'hotel' && hasHotel(currentPlayer.properties, color)) return false
        return true
      })

    return (
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>{getTitle()}</div>
          {eligibleSets.length > 0 ? (
            <>
              <div className={styles.modalSubtitle}>
                {action === 'house' ? 'Choose a complete set to add a house' : 'Choose a set with a house to add a hotel'}
              </div>
              <div className={styles.playerList}>
                {eligibleSets.map(([color]) => (
                  <button key={color} className={styles.playerButton} onClick={() => {
                    resolveHouse && action === 'house' ? resolveHouse(modalData.cardId, color) : resolveHotel(modalData.cardId, color)
                    addToast(`Placed ${action} on ${color}`, 'success')
                    closeModal()
                  }}>
                    {color}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.modalSubtitle}>
              {action === 'house'
                ? 'You need a complete property set to place a house.'
                : 'You need a complete set with a house to place a hotel.'}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.cancelButton} onClick={closeModal}>Cancel</button>
            <button className={styles.cancelButton} onClick={handleBankInstead}>Bank as Money</button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // For rent, show color selection
  if (action === 'rent') {
    const rentColors = modalData.rentColors || []
    const ownedColors = rentColors.filter(color =>
      currentPlayer.properties[color] && currentPlayer.properties[color].length > 0
    )

    return (
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>{getTitle()}</div>
          {ownedColors.length > 0 ? (
            <>
              <div className={styles.modalSubtitle}>Choose a color to charge rent for</div>
              <div className={styles.playerList}>
                {ownedColors.map(color => {
                  const rent = calculateRent(currentPlayer.properties, color)
                  return (
                    <button key={color} className={styles.playerButton} onClick={() => {
                      if (rent === 0) {
                        addToast(`You have no ${color} properties — can't charge rent!`, 'warning')
                        return
                      }
                      startRent(modalData.cardId, color)
                      addToast(`Charging $${rent}M rent for ${color}!`, 'success')
                      closeModal()
                    }}>
                      {color} — ${rent}M rent
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className={styles.modalSubtitle}>
              You don&apos;t own any matching properties.
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.cancelButton} onClick={closeModal}>Cancel</button>
            <button className={styles.cancelButton} onClick={handleBankInstead}>Bank as Money</button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // Step 1: Select player (for debtCollector, dealBreaker, slyDeal, forcedDeal)
  if (selectedPlayer === null) {
    return (
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>{getTitle()}</div>
          <div className={styles.modalSubtitle}>Choose a player</div>
          <div className={styles.playerList}>
            {opponents.map(p => {
              const payable = getPayableTotal(p)
              const isDebt = action === 'debtCollector'
              const disabled = isDebt && payable === 0
              return (
                <button
                  key={p.index}
                  className={styles.playerButton}
                  disabled={disabled}
                  style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                  onClick={() => {
                    if (disabled) return
                    if (isDebt) {
                      startDebtCollector(modalData.cardId, p.index)
                      addToast(`Debt Collector! ${p.name} owes $5M`, 'info')
                      closeModal()
                    } else {
                      setSelectedPlayer(p.index)
                    }
                  }}
                >
                  {p.name}
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: '8px' }}>
                    {isDebt
                      ? (payable > 0 ? `$${payable}M in assets` : 'nothing to pay')
                      : `${Object.values(p.properties).flat().length} props, ${p.bank.length} bank`}
                  </span>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.cancelButton} onClick={closeModal}>Cancel</button>
            <button className={styles.cancelButton} onClick={handleBankInstead}>Bank as Money</button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // Step 2: Deal Breaker — select color set
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
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>Choose a set to steal</div>
          <div className={styles.playerList}>
            {sets.map(([color, cards]) => (
              <button key={color} className={styles.playerButton} onClick={() => {
                executeDealBreaker(modalData.cardId, selectedPlayer, color)
                addToast(`Deal Breaker! Stole ${color} set (${cards.length} cards)`, 'success')
                closeModal()
              }}>
                {color} ({cards.length} cards)
              </button>
            ))}
          </div>
          <button className={styles.cancelButton} onClick={() => setSelectedPlayer(null)}>Back</button>
        </motion.div>
      </motion.div>
    )
  }

  // Step 2: Sly Deal — select card to steal
  if (action === 'slyDeal') {
    const target = game.players[selectedPlayer]
    const allCards = Object.entries(target.properties).flatMap(([color, cards]) =>
      cards.map(c => ({ ...c, displayColor: color }))
    )
    return (
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>Choose a card to steal</div>
          <div className={styles.playerList}>
            {allCards.map(card => (
              <button key={card.id} className={styles.playerButton} onClick={() => {
                executeSlyDeal(modalData.cardId, selectedPlayer, card.id)
                addToast('Sly Deal! Stole a property', 'success')
                closeModal()
              }}>
                {card.name} ({card.displayColor})
              </button>
            ))}
          </div>
          <button className={styles.cancelButton} onClick={() => setSelectedPlayer(null)}>Back</button>
        </motion.div>
      </motion.div>
    )
  }

  // Step 2: Forced Deal — select their card
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

  // Step 3: Forced Deal — select your card to give
  if (action === 'forcedDeal' && theirCardId !== null) {
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
                executeForcedDeal(modalData.cardId, selectedPlayer, card.id, theirCardId)
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
