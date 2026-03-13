const ACTION_ICONS = {
  'Pass Go': '\uD83C\uDFAF',
  'Deal Breaker': '\uD83D\uDCA5',
  'Sly Deal': '\uD83E\uDD8A',
  'Forced Deal': '\uD83D\uDD04',
  'Debt Collector': '\uD83D\uDCB0',
  "It's My Birthday": '\uD83C\uDF82',
  'Just Say No': '\uD83D\uDEAB',
  'Double the Rent': '\u26A1',
  'House': '\uD83C\uDFE0',
  'Hotel': '\uD83C\uDFE8',
}

function ActionCard({ card, styles }) {
  const icon = ACTION_ICONS[card.name] || '\uD83C\uDCCF'

  return (
    <div className={styles.actionCard}>
      <span className={styles.actionName}>{card.name}</span>
      <span className={styles.actionIcon}>{icon}</span>
      <span className={styles.actionDesc}>{card.description}</span>
    </div>
  )
}

export default ActionCard
