import useGameStore from '../../store/gameStore.js'
import styles from './HUD.module.css'

function TurnIndicator() {
  const game = useGameStore(s => s.game)
  if (!game) return null

  const currentPlayer = game.players[game.currentPlayerIndex]

  return (
    <div className={styles.turnIndicator}>
      <span className={styles.turnName}>{currentPlayer.name}&apos;s Turn</span>
      <span className={styles.turnPhase}>{game.turnPhase}</span>
      {game.turnPhase === 'play' && (
        <span className={styles.playsLeft}>{game.playsRemaining}</span>
      )}
    </div>
  )
}

export default TurnIndicator
