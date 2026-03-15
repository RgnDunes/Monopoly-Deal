import Card from '../Card/Card.jsx'

const s = {
  zone: {
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 12px',
    minWidth: '220px',
    maxWidth: '500px',
    border: '1px solid var(--color-border)',
    fontFamily: 'var(--font-game)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  name: {
    color: 'var(--color-text)',
    fontSize: '0.85rem',
    fontWeight: '700',
  },
  handCount: {
    color: 'var(--color-text-muted)',
    fontSize: '0.7rem',
    background: 'rgba(255,255,255,0.08)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  section: {
    marginBottom: '6px',
  },
  sectionLabel: {
    fontSize: '0.65rem',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '3px',
    fontWeight: '600',
  },
  bankValue: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: 'var(--color-money-accent)',
    marginBottom: '4px',
  },
  cardRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginTop: '2px',
  },
  colorLabel: {
    fontSize: '0.6rem',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginTop: '4px',
    marginBottom: '2px',
  },
  emptyText: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
  },
}

function PlayerZone({ player, isOpponent = false }) {
  if (!player || !isOpponent) return null

  const bankTotal = player.bank.reduce((sum, c) => sum + (c.value || 0), 0)
  const propEntries = Object.entries(player.properties).filter(([, cards]) => cards && cards.length > 0)

  return (
    <div style={s.zone}>
      <div style={s.header}>
        <span style={s.name}>{player.name}</span>
        <span style={s.handCount}>{player.hand.length} in hand</span>
      </div>

      <div style={s.section}>
        <div style={s.sectionLabel}>Bank</div>
        {bankTotal > 0 ? (
          <>
            <div style={s.bankValue}>${bankTotal}M</div>
            <div style={s.cardRow}>
              {player.bank.map(c => (
                <Card key={c.id} card={c} size="sm" />
              ))}
            </div>
          </>
        ) : (
          <span style={s.emptyText}>Empty</span>
        )}
      </div>

      <div style={s.section}>
        <div style={s.sectionLabel}>Properties</div>
        {propEntries.length > 0 ? (
          propEntries.map(([color, cards]) => (
            <div key={color}>
              <div style={s.colorLabel}>{color}</div>
              <div style={s.cardRow}>
                {cards.map(c => (
                  <Card key={c.id} card={c} size="sm" />
                ))}
              </div>
            </div>
          ))
        ) : (
          <span style={s.emptyText}>None</span>
        )}
      </div>
    </div>
  )
}

export default PlayerZone
