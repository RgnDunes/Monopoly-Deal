import { useState } from 'react'
import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import useGameStore from '../../store/gameStore.js'
import Card from '../Card/Card.jsx'
import styles from './Modals.module.css'

function DiscardModal() {
  const activeModal = useUIStore(s => s.activeModal)
  const modalData = useUIStore(s => s.modalData)
  const closeModal = useUIStore(s => s.closeModal)
  const addToast = useUIStore(s => s.addToast)
  const game = useGameStore(s => s.game)
  const discardCards = useGameStore(s => s.discardCards)
  const [selectedIds, setSelectedIds] = useState([])

  if (activeModal !== 'discard' || !modalData || !game) return null

  const currentPlayer = game.players[game.currentPlayerIndex]
  const needToDiscard = modalData.needToDiscard || 0

  if (needToDiscard <= 0) return null

  const toggleCard = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= needToDiscard) return prev
      return [...prev, id]
    })
  }

  const canConfirm = selectedIds.length === needToDiscard

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <div className={styles.modalTitle}>
          Discard {needToDiscard} card{needToDiscard > 1 ? 's' : ''}
        </div>
        <div className={styles.modalSubtitle}>
          You have {currentPlayer.hand.length} cards — max 7 allowed. Select {needToDiscard} to discard.
        </div>
        <div className={styles.payCardGrid}>
          {currentPlayer.hand.map(card => (
            <Card
              key={card.id}
              card={card}
              size="sm"
              selected={selectedIds.includes(card.id)}
              onClick={() => toggleCard(card.id)}
            />
          ))}
        </div>
        <div className={styles.payTotal}>
          Selected: {selectedIds.length} / {needToDiscard}
        </div>
        <button
          className={styles.primaryButton}
          disabled={!canConfirm}
          onClick={() => {
            discardCards(selectedIds)
            addToast(`Discarded ${needToDiscard} card${needToDiscard > 1 ? 's' : ''}`, 'info')
            setSelectedIds([])
            closeModal()
          }}
        >
          Discard
        </button>
      </motion.div>
    </motion.div>
  )
}

export default DiscardModal
