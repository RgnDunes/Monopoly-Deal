import Card from '../Card/Card.jsx'
import styles from './Hand.module.css'

function Hand({ cards = [], playsRemaining = 0, isMyTurn = false, onCardClick }) {
  return (
    <div className={`${styles.hand} ${!isMyTurn ? styles.handDisabled : ''}`}>
      <div className={styles.playsIndicator}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`${styles.playDot} ${i < playsRemaining ? styles.active : ''}`}
          />
        ))}
      </div>
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          playable={isMyTurn && playsRemaining > 0}
          onClick={() => onCardClick?.(card)}
        />
      ))}
    </div>
  )
}

export default Hand
