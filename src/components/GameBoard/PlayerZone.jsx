import PropertyArea from '../PropertyArea/PropertyArea.jsx'

// Inline styles for the opponent mini-zone since it's a small component
const zoneStyles = {
  zone: {
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '8px',
    minWidth: '160px',
    maxWidth: '260px',
    border: '1px solid var(--color-border)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  name: {
    color: 'var(--color-text)',
  },
  handCount: {
    color: 'var(--color-text-muted)',
    fontSize: '0.7rem',
  },
  bankRow: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    marginBottom: '4px',
  },
  miniProps: {
    transform: 'scale(0.6)',
    transformOrigin: 'top left',
    maxHeight: '100px',
    overflow: 'hidden',
  },
}

function PlayerZone({ player, isOpponent = false }) {
  if (!player) return null

  const bankTotal = player.bank.reduce((s, c) => s + (c.value || 0), 0)

  if (isOpponent) {
    return (
      <div style={zoneStyles.zone}>
        <div style={zoneStyles.header}>
          <span style={zoneStyles.name}>{player.name}</span>
          <span style={zoneStyles.handCount}>{player.hand.length} cards</span>
        </div>
        <div style={zoneStyles.bankRow}>
          Bank: ${bankTotal}M
        </div>
        <div style={zoneStyles.miniProps}>
          <PropertyArea properties={player.properties} />
        </div>
      </div>
    )
  }

  return null
}

export default PlayerZone
