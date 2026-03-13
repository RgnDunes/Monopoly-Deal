import { motion } from 'framer-motion'
import PropertyCard from './PropertyCard.jsx'
import MoneyCard from './MoneyCard.jsx'
import ActionCard from './ActionCard.jsx'
import RentCard from './RentCard.jsx'
import CardBack from './CardBack.jsx'
import styles from './Card.module.css'

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

function Card({ card, size = 'md', faceDown = false, selected = false, playable = false, disabled = false, onClick }) {
  if (faceDown) {
    return (
      <motion.div
        className={`${styles.card} ${styles[size]}`}
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
      >
        <CardBack />
      </motion.div>
    )
  }

  const classNames = [
    styles.card,
    styles[size],
    selected && styles.selected,
    playable && styles.playable,
    disabled && styles.disabled,
  ].filter(Boolean).join(' ')

  const renderCardContent = () => {
    switch (card.type) {
      case 'property':
        return <PropertyCard card={card} colorMap={COLOR_MAP} styles={styles} />
      case 'money':
        return <MoneyCard card={card} styles={styles} />
      case 'action':
        return <ActionCard card={card} styles={styles} />
      case 'rent':
        return <RentCard card={card} colorMap={COLOR_MAP} styles={styles} />
      case 'wild':
        return <PropertyCard card={card} colorMap={COLOR_MAP} styles={styles} isWild />
      default:
        return null
    }
  }

  return (
    <motion.div
      className={classNames}
      onClick={onClick}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.97 }}
      layout
      aria-label={`${card.name}, ${card.type}, value $${card.value}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <span className={styles.valueBadge}>${card.value}M</span>
      <span className={styles.typeBadge}>
        {card.type === 'property' ? 'PROP' : card.type === 'wild' ? 'WILD' : card.type === 'money' ? '$' : card.type.toUpperCase()}
      </span>
      {renderCardContent()}
    </motion.div>
  )
}

export default Card
