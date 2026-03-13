function PropertyCard({ card, colorMap, styles, isWild }) {
  const bgColor = colorMap[card.color] || '#999'
  const rent = card.rent || []

  return (
    <>
      <div className={styles.propertyTop} style={{ background: bgColor }}>
        <span className={styles.propertyName}>
          {isWild ? `${(card.colors || []).join(' / ')} Wild` : card.name}
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
