import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import useGameStore from '../../store/gameStore.js'
import styles from './Modals.module.css'

function ActionChoiceModal() {
  const activeModal = useUIStore(s => s.activeModal)
  const modalData = useUIStore(s => s.modalData)
  const closeModal = useUIStore(s => s.closeModal)
  const showModal = useUIStore(s => s.showModal)
  const addToast = useUIStore(s => s.addToast)
  const bankCard = useGameStore(s => s.bankCard)
  const playActionCard = useGameStore(s => s.playActionCard)
  const resolvePassGo = useGameStore(s => s.resolvePassGo)
  const startBirthday = useGameStore(s => s.startBirthday)

  if (activeModal !== 'actionChoice' || !modalData) return null

  const { card, subAction } = modalData

  // Just Say No: keep or bank
  if (subAction === 'justSayNo') {
    return (
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>Just Say No</div>
          <div className={styles.modalSubtitle}>This card blocks actions played against you. Keep it for defense or bank it.</div>
          <div className={styles.playerList}>
            <button className={styles.playerButton} onClick={closeModal}>
              Keep in Hand — Use to block actions
            </button>
            <button className={styles.playerButton} onClick={() => {
              bankCard(card.id)
              addToast('Banked Just Say No as $4M', 'success')
              closeModal()
            }}>
              Bank as Money — $4M
            </button>
          </div>
          <button className={styles.cancelButton} onClick={closeModal}>Cancel</button>
        </motion.div>
      </motion.div>
    )
  }

  // Double the Rent: show rent card selection
  if (subAction === 'doubleTheRent') {
    const rentCards = modalData.rentCards || []
    return (
      <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
        <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className={styles.modalTitle}>{card.name}</div>
          <div className={styles.modalSubtitle}>Choose a rent card to play with (uses 2 plays)</div>
          <div className={styles.playerList}>
            {rentCards.map(rc => (
              <button key={rc.id} className={styles.playerButton} onClick={() => {
                closeModal()
                showModal('targetSelect', {
                  action: 'rent',
                  cardId: rc.id,
                  rentColors: rc.rentColors,
                  targetsAll: rc.targetsAll,
                  doubled: true,
                  doubleCardId: card.id,
                })
              }}>
                {rc.name} — colors: {(rc.rentColors || []).join(', ')}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.cancelButton} onClick={closeModal}>Cancel</button>
            <button className={styles.cancelButton} onClick={() => {
              bankCard(card.id)
              addToast(`Banked ${card.name} as $${card.value}M`, 'success')
              closeModal()
            }}>Bank as $1M</button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  const handlePlayAction = () => {
    const name = card.name.toLowerCase()
    if (name === 'pass go') {
      playActionCard(card.id)
      resolvePassGo()
      addToast('Pass Go! Drew 2 extra cards', 'success')
    } else if (name.includes('birthday')) {
      startBirthday(card.id)
      addToast("It's your birthday! Everyone owes $2M", 'info')
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
    if (name.includes('birthday')) return 'All opponents pay $2M each'
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
