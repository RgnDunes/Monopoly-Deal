import { useNavigate } from 'react-router-dom'
import useGameStore from '../../store/gameStore.js'
import styles from './HUD.module.css'

function TurnIndicator() {
  const game = useGameStore(s => s.game)
  const resetGame = useGameStore(s => s.resetGame)
  const navigate = useNavigate()

  if (!game) return null

  const currentPlayer = game.players[game.currentPlayerIndex]

  const handleExit = () => {
    resetGame()
    navigate('/')
  }

  return (
    <div className={styles.turnIndicator}>
      <span className={styles.turnName}>{currentPlayer.name}&apos;s Turn</span>
      <span className={styles.turnPhase}>{game.turnPhase}</span>
      {game.turnPhase === 'play' && (
        <span className={styles.playsLeft}>{game.playsRemaining}</span>
      )}
      <button className={styles.exitButton} onClick={handleExit}>
        Exit
      </button>
    </div>
  )
}

export default TurnIndicator
