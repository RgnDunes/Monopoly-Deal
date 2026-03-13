import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import styles from './Modals.module.css'

function JustSayNoModal() {
  const activeModal = useUIStore(s => s.activeModal)
  const modalData = useUIStore(s => s.modalData)
  const closeModal = useUIStore(s => s.closeModal)

  if (activeModal !== 'justSayNo' || !modalData) return null

  const handleAccept = () => {
    modalData.onAccept?.()
    closeModal()
  }

  const handleBlock = () => {
    modalData.onBlock?.()
    closeModal()
  }

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
        <div className={styles.modalTitle}>Just Say No?</div>
        <div className={styles.modalSubtitle}>
          {modalData.attackerName} played {modalData.actionName} against you!
        </div>
        <div className={styles.jsnChoice}>
          <button className={styles.jsnAccept} onClick={handleAccept}>
            Accept
          </button>
          {modalData.hasJSN && (
            <button className={styles.jsnBlock} onClick={handleBlock}>
              Just Say No!
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default JustSayNoModal
