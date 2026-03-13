import Card from '../Card/Card.jsx'
import styles from './Hand.module.css'

function Hand({ cards = [], playsRemaining = 0, isMyTurn = false, onCardClick }) {
  // Compute overlap so all cards fit without scrolling
  // Cards are 100px wide (--card-w-md), hand is roughly 65% of viewport
  const cardWidth = 100
  const availableWidth = typeof window !== 'undefined' ? window.innerWidth * 0.65 : 800
  let overlap = 0
  if (cards.length > 1) {
    const totalWidth = cardWidth * cards.length
    if (totalWidth > availableWidth) {
      overlap = Math.min(75, (totalWidth - availableWidth) / (cards.length - 1))
    }
  }

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
      {cards.map((card, index) => (
        <div
          key={card.id}
          className={styles.cardSlot}
          style={{ marginLeft: index === 0 ? 0 : `-${overlap}px` }}
        >
          <Card
            card={card}
            playable={isMyTurn && playsRemaining > 0}
            onClick={() => onCardClick?.(card)}
          />
        </div>
      ))}
    </div>
  )
}

export default Hand
