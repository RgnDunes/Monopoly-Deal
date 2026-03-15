import { useState } from 'react'
import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import useGameStore from '../../store/gameStore.js'
import { calculateRent } from '../../engine/rent.js'
import { isSetComplete, hasHouse, hasHotel } from '../../engine/properties.js'
import Card from '../Card/Card.jsx'
import styles from './Modals.module.css'

const COLOR_CSS = {
  brown: 'var(--color-brown)',
  lightblue: 'var(--color-lightblue)',
  pink: 'var(--color-pink)',
  orange: 'var(--color-orange)',
  red: 'var(--color-red)',
  yellow: 'var(--color-yellow)',
  green: 'var(--color-green)',
  darkblue: 'var(--color-darkblue)',
  railroad: 'var(--color-railroad)',
  utility: 'var(--color-utility)',
}

function TargetSelectModal() {
  const activeModal = useUIStore(s => s.activeModal)
  const modalData = useUIStore(s => s.modalData)
  const closeModal = useUIStore(s => s.closeModal)
  const addToast = useUIStore(s => s.addToast)
  const game = useGameStore(s => s.game)
  const bankCard = useGameStore(s => s.bankCard)
  const initTargetedAction = useGameStore(s => s.initTargetedAction)
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
          <div className={styles.colorPickerGrid}>
            {targetColors.map(color => (
              <button
                key={color}
                className={styles.colorPickerBtn}
                style={{ background: COLOR_CSS[color] }}
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
        if (action === 'house' && hasHouse(currentPlayer, color)) return false
        if (action === 'house' && hasHotel(currentPlayer, color)) return false
        if (action === 'hotel' && !hasHouse(currentPlayer, color)) return false
        if (action === 'hotel' && hasHotel(currentPlayer, color)) return false
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
              {eligibleSets.map(([color, cards]) => (
                <button
                  key={color}
                  className={styles.cardSetButton}
                  onClick={() => {
                    if (action === 'house') {
                      resolveHouse(modalData.cardId, color)
                    } else {
                      resolveHotel(modalData.cardId, color)
                    }
                    addToast(`Placed ${action} on ${color}`, 'success')
                    closeModal()
                  }}
                >
                  <div className={styles.paySectionLabel} style={{ color: COLOR_CSS[color] }}>{color}</div>
                  <div className={styles.payCardGrid}>
                    {cards.map(c => <Card key={c.id} card={c} size="sm" />)}
                  </div>
                </button>
              ))}
            </>
          ) : (
            (() => {
              const completeSets = Object.entries(currentPlayer.properties)
                .filter(([color]) => color !== 'railroad' && color !== 'utility' && isSetComplete(currentPlayer.properties, color))
              const setsWithHouses = completeSets.filter(([color]) => hasHouse(currentPlayer, color))

              if (action === 'hotel') {
                if (completeSets.length === 0) {
                  return <div className={styles.modalSubtitle}>You have no complete property sets. Complete a set first, then add a House, then a Hotel.</div>
                }
                if (setsWithHouses.length === 0) {
                  return (
                    <div className={styles.modalSubtitle}>
                      Your complete sets ({completeSets.map(([c]) => c).join(', ')}) don&apos;t have Houses yet.
                      <br />Play a House card first, then you can add a Hotel.
                    </div>
                  )
                }
                return <div className={styles.modalSubtitle}>All your sets with houses already have hotels.</div>
              }
              if (completeSets.length === 0) {
                return <div className={styles.modalSubtitle}>You have no complete property sets. Complete a set to place a House.</div>
              }
              return <div className={styles.modalSubtitle}>All your complete sets already have houses.</div>
            })()
          )}
          <div className={styles.payActions}>
            <button className={styles.cancelButton} onClick={closeModal}>Cancel</button>
            <button className={styles.cancelButton} onClick={handleBankInstead}>Bank as Money</button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // For rent, show color selection with property cards
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
              {ownedColors.map(color => {
                const baseRent = calculateRent(currentPlayer, color)
                const isDoubled = modalData.doubled === true
                const displayRent = isDoubled ? baseRent * 2 : baseRent
                return (
                  <button
                    key={color}
                    className={styles.cardSetButton}
                    onClick={() => {
                      if (baseRent === 0) {
                        addToast(`You have no ${color} properties — can't charge rent!`, 'warning')
                        return
                      }
                      startRent(modalData.cardId, color, isDoubled, modalData.doubleCardId)
                      addToast(`Charging $${displayRent}M${isDoubled ? ' (DOUBLED!)' : ''} rent for ${color}!`, 'success')
                      closeModal()
                    }}
                  >
                    <div className={styles.paySectionLabel} style={{ color: COLOR_CSS[color] }}>
                      {color} — ${displayRent}M rent{isDoubled ? ' (2x!)' : ''}
                    </div>
                    <div className={styles.payCardGrid}>
                      {currentPlayer.properties[color].map(c => <Card key={c.id} card={c} size="sm" />)}
                    </div>
                  </button>
                )
              })}
            </>
          ) : (
            <div className={styles.modalSubtitle}>
              You don&apos;t own any matching properties.
            </div>
          )}
          <div className={styles.payActions}>
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
              const propCount = Object.values(p.properties).flat().length
              const bankTotal = p.bank.reduce((sum, c) => sum + (c.value || 0), 0)
              return (
                <button
                  key={p.index}
                  className={styles.playerButton}
                  onClick={() => {
                    if (action === 'debtCollector') {
                      startDebtCollector(modalData.cardId, p.index)
                      addToast(`Debt Collector! ${p.name} owes $5M`, 'info')
                      closeModal()
                    } else {
                      setSelectedPlayer(p.index)
                    }
                  }}
                >
                  {p.name}
                  <span className={styles.playerMeta}>
                    {propCount} properties, ${bankTotal}M bank
                  </span>
                </button>
              )
            })}
          </div>
          <div className={styles.payActions}>
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
          {sets.map(([color, cards]) => (
            <button
              key={color}
              className={styles.cardSetButton}
              onClick={() => {
                initTargetedAction(modalData.cardId, 'dealBreaker', { targetIndex: selectedPlayer, color })
                addToast(`Deal Breaker! Targeting ${color} set (${cards.length} cards)`, 'success')
                closeModal()
              }}
            >
              <div className={styles.paySectionLabel} style={{ color: COLOR_CSS[color] }}>{color} ({cards.length} cards)</div>
              <div className={styles.payCardGrid}>
                {cards.map(c => <Card key={c.id} card={c} size="sm" />)}
              </div>
            </button>
          ))}
          <button className={styles.cancelButton} onClick={() => setSelectedPlayer(null)}>Back</button>
        </motion.div>
      </motion.div>
    )
  }

  // Step 2: Sly Deal — select card to steal
  if (action === 'slyDeal') {
    const target = game.players[selectedPlayer]
    const colorGroups = Object.entries(target.properties)
      .filter(([, cards]) => cards && cards.length > 0)

    return (
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>Choose a card to steal</div>
          {colorGroups.map(([color, cards]) => (
            <div key={color} className={styles.paySection}>
              <div className={styles.paySectionLabel}>{color}</div>
              <div className={styles.payCardGrid}>
                {cards.map(card => (
                  <Card
                    key={card.id}
                    card={card}
                    size="sm"
                    onClick={() => {
                      initTargetedAction(modalData.cardId, 'slyDeal', { targetIndex: selectedPlayer, cardId: card.id })
                      addToast('Sly Deal! Targeting a property', 'success')
                      closeModal()
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
          <button className={styles.cancelButton} onClick={() => setSelectedPlayer(null)}>Back</button>
        </motion.div>
      </motion.div>
    )
  }

  // Step 2: Forced Deal — select their card
  if (action === 'forcedDeal' && theirCardId === null) {
    const target = game.players[selectedPlayer]
    const colorGroups = Object.entries(target.properties)
      .filter(([, cards]) => cards && cards.length > 0)

    if (colorGroups.length === 0) {
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
          {colorGroups.map(([color, cards]) => (
            <div key={color} className={styles.paySection}>
              <div className={styles.paySectionLabel}>{color}</div>
              <div className={styles.payCardGrid}>
                {cards.map(card => (
                  <Card
                    key={card.id}
                    card={card}
                    size="sm"
                    onClick={() => setTheirCardId(card.id)}
                  />
                ))}
              </div>
            </div>
          ))}
          <button className={styles.cancelButton} onClick={() => setSelectedPlayer(null)}>Back</button>
        </motion.div>
      </motion.div>
    )
  }

  // Step 3: Forced Deal — select your card to give
  if (action === 'forcedDeal' && theirCardId !== null) {
    const myColorGroups = Object.entries(currentPlayer.properties)
      .filter(([, cards]) => cards && cards.length > 0)

    if (myColorGroups.length === 0) {
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
          {myColorGroups.map(([color, cards]) => (
            <div key={color} className={styles.paySection}>
              <div className={styles.paySectionLabel}>{color}</div>
              <div className={styles.payCardGrid}>
                {cards.map(card => (
                  <Card
                    key={card.id}
                    card={card}
                    size="sm"
                    onClick={() => {
                      initTargetedAction(modalData.cardId, 'forcedDeal', { targetIndex: selectedPlayer, yourCardId: card.id, theirCardId })
                      addToast('Forced Deal! Swapping properties', 'success')
                      setTheirCardId(null)
                      closeModal()
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
          <button className={styles.cancelButton} onClick={() => setTheirCardId(null)}>Back</button>
        </motion.div>
      </motion.div>
    )
  }

  return null
}

export default TargetSelectModal
