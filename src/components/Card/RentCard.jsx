function RentCard({ card, colorMap, styles }) {
  const colors = card.rentColors || []
  const isAnyColor = !card.targetsAll

  return (
    <div className={styles.rentCard}>
      <span className={styles.rentTitle}>RENT</span>
      <div className={styles.rentSwatches}>
        {isAnyColor ? (
          <div className={styles.rentSwatch} style={{
            background: 'conic-gradient(var(--color-red), var(--color-yellow), var(--color-green), var(--color-darkblue), var(--color-red))',
          }} />
        ) : (
          colors.map(color => (
            <div
              key={color}
              className={styles.rentSwatch}
              style={{ background: colorMap[color] || '#999' }}
            />
          ))
        )}
      </div>
      <span className={styles.rentTarget}>
        {isAnyColor ? 'Charge one player' : 'Charge all players'}
      </span>
    </div>
  )
}

export default RentCard
