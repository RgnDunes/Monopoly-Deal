function MoneyCard({ card, styles }) {
  return (
    <div className={styles.moneyCard}>
      <span className={styles.moneyLabel}>Monopoly Deal</span>
      <span className={styles.moneyAmount}>${card.value}M</span>
    </div>
  )
}

export default MoneyCard
