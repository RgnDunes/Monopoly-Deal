import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import styles from './Modals.module.css'

function PassDeviceModal() {
  const showPassDevice = useUIStore(s => s.showPassDevice)
  const nextPlayerName = useUIStore(s => s.nextPlayerName)
  const hidePassDeviceModal = useUIStore(s => s.hidePassDeviceModal)

  if (!showPassDevice) return null

  return (
    <motion.div
      className={styles.passDeviceOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className={styles.passDeviceTitle}>Pass the device</div>
      <div className={styles.passDeviceSubtitle}>
        It&apos;s {nextPlayerName}&apos;s turn
      </div>
      <button className={styles.primaryButton} style={{ width: 'auto', padding: '12px 48px' }} onClick={hidePassDeviceModal}>
        I&apos;m {nextPlayerName}
      </button>
    </motion.div>
  )
}

export default PassDeviceModal
