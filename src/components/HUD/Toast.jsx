import { AnimatePresence, motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import styles from './HUD.module.css'

const variantClass = {
  info: styles.toastInfo,
  success: styles.toastSuccess,
  error: styles.toastError,
  warning: styles.toastWarning,
}

function Toast() {
  const toasts = useUIStore(s => s.toasts)
  const removeToast = useUIStore(s => s.removeToast)

  return (
    <div className={styles.toastContainer}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className={`${styles.toast} ${variantClass[t.variant] || styles.toastInfo}`}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            onClick={() => removeToast(t.id)}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default Toast
