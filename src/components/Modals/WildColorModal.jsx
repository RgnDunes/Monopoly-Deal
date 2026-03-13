import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import useGameStore from '../../store/gameStore.js'
import styles from './Modals.module.css'

const ALL_COLORS = ['brown', 'lightblue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkblue', 'railroad', 'utility']

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

function WildColorModal() {
  const activeModal = useUIStore(s => s.activeModal)
  const modalData = useUIStore(s => s.modalData)
  const closeModal = useUIStore(s => s.closeModal)
  const addToast = useUIStore(s => s.addToast)
  const playPropertyCard = useGameStore(s => s.playPropertyCard)

  if (activeModal !== 'wildColor' || !modalData) return null

  const colors = modalData.colors || ALL_COLORS

  const handleSelect = (color) => {
    playPropertyCard(modalData.cardId, color)
    addToast(`Placed wild on ${color}`, 'success')
    closeModal()
  }

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={closeModal}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalTitle}>Choose Color</div>
        <div className={styles.modalSubtitle}>Where should this wild card go?</div>
        <div className={styles.colorGrid}>
          {colors.map(color => (
            <button
              key={color}
              className={styles.colorButton}
              style={{ background: COLOR_CSS[color] || color }}
              title={color}
              onClick={() => handleSelect(color)}
            />
          ))}
        </div>
        <button className={styles.cancelButton} onClick={closeModal}>Cancel</button>
      </motion.div>
    </motion.div>
  )
}

export default WildColorModal
