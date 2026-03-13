import { motion } from 'framer-motion'
import useGameStore from '../../store/gameStore.js'
import styles from './WinScreen.module.css'

function WinScreen() {
  const game = useGameStore(s => s.game)
  const resetGame = useGameStore(s => s.resetGame)

  if (!game || game.winner === null || game.winner === undefined) return null

  const winner = game.players[game.winner]

  return (
    <motion.div
      className={styles.winOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
      >
        <div className={styles.winTitle}>Victory!</div>
      </motion.div>
      <div className={styles.winnerName}>
        {winner?.name || 'Unknown'} wins!
      </div>
      <button className={styles.playAgainButton} onClick={resetGame}>
        Play Again
      </button>
    </motion.div>
  )
}

export default WinScreen
