function PropertyCard({ card, colorMap, styles, isWild }) {
  const colors = card.colors || []
  const rent = card.rent || []

  let topBackground
  if (isWild && card.isRainbowWild) {
    topBackground = 'linear-gradient(135deg, #e74c3c 0%, #f39c12 20%, #f1c40f 40%, #2ecc71 60%, #3498db 80%, #9b59b6 100%)'
  } else if (isWild && colors.length >= 2) {
    topBackground = `linear-gradient(135deg, ${colorMap[colors[0]] || '#999'} 50%, ${colorMap[colors[1]] || '#999'} 50%)`
  } else {
    topBackground = colorMap[card.color] || '#999'
  }

  return (
    <>
      <div className={styles.propertyTop} style={{ background: topBackground }}>
        <span className={styles.propertyName}>
          {isWild ? card.name : card.name}
        </span>
      </div>
      <div className={styles.propertyBottom}>
        {rent.map((r, i) => (
          <div key={i} className={`${styles.rentRow} ${i === rent.length - 1 ? styles.active : ''}`}>
            <span>{i + 1} card{i > 0 ? 's' : ''}</span>
            <span>${r}M</span>
          </div>
        ))}
        <div style={{ fontSize: '8px', color: '#999', textAlign: 'center', marginTop: '2px' }}>
          Set: {card.setSize}
        </div>
      </div>
    </>
  )
}

export default PropertyCard
