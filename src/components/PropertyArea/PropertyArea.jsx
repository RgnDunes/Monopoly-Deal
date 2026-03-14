import PropertySet from './PropertySet.jsx'
import styles from './PropertyArea.module.css'

function PropertyArea({ properties = {}, player, onCardClick, onEnhancementClick }) {
  const colorEntries = Object.entries(properties).filter(
    ([_color, cards]) => cards && cards.length > 0
  )

  if (colorEntries.length === 0) {
    return <div className={styles.propertyArea} />
  }

  return (
    <div className={styles.propertyArea}>
      {colorEntries.map(([color, cards]) => (
        <PropertySet
          key={color}
          color={color}
          cards={cards}
          player={player}
          onCardClick={onCardClick ? (card) => onCardClick(card, color) : undefined}
          onEnhancementClick={onEnhancementClick}
        />
      ))}
    </div>
  )
}

export default PropertyArea
