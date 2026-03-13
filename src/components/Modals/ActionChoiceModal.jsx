import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import useGameStore from '../../store/gameStore.js'
import styles from './Modals.module.css'

function ActionChoiceModal() {
  const activeModal = useUIStore(s => s.activeModal)
  const modalData = useUIStore(s => s.modalData)
  const closeModal = useUIStore(s => s.closeModal)
  const addToast = useUIStore(s => s.addToast)
  const bankCard = useGameStore(s => s.bankCard)
  const playActionCard = useGameStore(s => s.playActionCard)
  const resolvePassGo = useGameStore(s => s.resolvePassGo)

  if (activeModal !== 'actionChoice' || !modalData) return null

  const { card } = modalData

  const handlePlayAction = () => {
    const name = card.name.toLowerCase()
    if (name === 'pass go') {
      playActionCard(card.id)
      resolvePassGo()
      addToast('Pass Go! Drew 2 extra cards', 'success')
    }
    closeModal()
  }

  const handleBank = () => {
    bankCard(card.id)
    addToast(`Banked ${card.name} as $${card.value}M`, 'success')
    closeModal()
  }

  const getActionDescription = () => {
    const name = card.name.toLowerCase()
    if (name === 'pass go') return 'Draw 2 extra cards'
    return card.description || 'Play this card'
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
        <div className={styles.modalTitle}>{card.name}</div>
        <div className={styles.modalSubtitle}>How do you want to use this card?</div>
        <div className={styles.playerList}>
          <button className={styles.playerButton} onClick={handlePlayAction}>
            Play as Action — {getActionDescription()}
          </button>
          <button className={styles.playerButton} onClick={handleBank}>
            Bank as Money — ${card.value}M
          </button>
        </div>
        <button className={styles.cancelButton} onClick={closeModal}>Cancel</button>
      </motion.div>
    </motion.div>
  )
}

export default ActionChoiceModal
