import Card from '../Card/Card.jsx'
import { PROPERTY_CONFIG } from '../../engine/cards.js'
import styles from './PropertyArea.module.css'

const COLOR_MAP = {
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

function PropertySet({ color, cards = [], player, onCardClick, onEnhancementClick }) {
  const config = PROPERTY_CONFIG[color]
  if (!config) return null

  const propertyCards = cards.filter(c => c.type === 'property' || c.type === 'wild')
  const isComplete = propertyCards.length >= config.setSize
  const hasHouse = player?.houses?.[color] === true
  const hasHotel = player?.hotels?.[color] === true

  return (
    <div className={`${styles.propertySet} ${isComplete ? styles.setComplete : ''}`}>
      <div className={styles.setHeader}>
        <div className={styles.setColor} style={{ background: COLOR_MAP[color] }} />
        <span className={styles.setCount}>{propertyCards.length}/{config.setSize}</span>
      </div>
      {cards.filter(c => c.type === 'property' || c.type === 'wild').map(card => (
        <Card
          key={card.id}
          card={card}
          size="sm"
          onClick={() => onCardClick?.(card)}
        />
      ))}
      {isComplete && <span className={styles.completeBadge}>Complete</span>}
      {hasHouse && !hasHotel && (
        <span
          className={`${styles.enhancementBadge} ${onEnhancementClick ? styles.clickable : ''}`}
          onClick={onEnhancementClick ? () => onEnhancementClick(color, 'house') : undefined}
          title="Click to bank house ($3M)"
        >
          🏠
        </span>
      )}
      {hasHotel && (
        <span
          className={`${styles.enhancementBadge} ${onEnhancementClick ? styles.clickable : ''}`}
          onClick={onEnhancementClick ? () => onEnhancementClick(color, 'hotel') : undefined}
          title="Click to bank hotel ($4M)"
        >
          🏨
        </span>
      )}
    </div>
  )
}

export default PropertySet
