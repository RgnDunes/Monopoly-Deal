import { motion } from 'framer-motion'
import useGameStore from '../../store/gameStore.js'
import useUIStore from '../../store/uiStore.js'
import styles from './Modals.module.css'

const ACTION_LABELS = {
  dealBreaker: 'Deal Breaker',
  slyDeal: 'Sly Deal',
  forcedDeal: 'Forced Deal',
}

function JustSayNoModal() {
  const game = useGameStore(s => s.game)
  const pendingAction = useGameStore(s => s.pendingAction)
  const acceptPendingAction = useGameStore(s => s.acceptPendingAction)
  const playJSNInChain = useGameStore(s => s.playJSNInChain)
  const addToast = useUIStore(s => s.addToast)

  if (!pendingAction || !game) return null

  const isTargetTurn = pendingAction.jsnChainCount % 2 === 0
  const responderIndex = isTargetTurn ? pendingAction.targetIndex : pendingAction.attackerIndex
  const responder = game.players[responderIndex]
  const attacker = game.players[pendingAction.attackerIndex]
  const target = game.players[pendingAction.targetIndex]

  const hasJSN = responder.hand.some(c => c.name?.toLowerCase() === 'just say no')
  const actionLabel = ACTION_LABELS[pendingAction.type] || pendingAction.type

  let description
  if (isTargetTurn) {
    if (pendingAction.jsnChainCount === 0) {
      description = `${attacker.name} played ${actionLabel} against you!`
    } else {
      description = `${attacker.name} countered your Just Say No!`
    }
  } else {
    description = `${target.name} blocked with Just Say No!`
  }

  const handleAccept = () => {
    if (isTargetTurn) {
      addToast(`${target.name} accepted the ${actionLabel}`, 'info')
    } else {
      addToast(`${attacker.name} accepted — ${actionLabel} blocked!`, 'warning')
    }
    acceptPendingAction()
  }

  const handleBlock = () => {
    addToast(`${responder.name} played Just Say No!`, 'warning')
    playJSNInChain()
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
        <div className={styles.modalTitle}>{responder.name} — Respond</div>
        <div className={styles.modalSubtitle}>{description}</div>
        <div className={styles.jsnChoice}>
          <button className={styles.jsnAccept} onClick={handleAccept}>
            {isTargetTurn ? 'Accept' : 'Accept (action blocked)'}
          </button>
          {hasJSN && (
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
