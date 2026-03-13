import PropertySet from './PropertySet.jsx'
import styles from './PropertyArea.module.css'

function PropertyArea({ properties = {}, onCardClick }) {
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
          onCardClick={onCardClick}
        />
      ))}
    </div>
  )
}

export default PropertyArea
