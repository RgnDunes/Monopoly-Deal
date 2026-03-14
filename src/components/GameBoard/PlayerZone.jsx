const COLOR_CSS = {
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

const s = {
  zone: {
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 12px',
    minWidth: '200px',
    maxWidth: '300px',
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
  },
  bankCards: {
    display: 'flex',
    gap: '3px',
    flexWrap: 'wrap',
    marginTop: '2px',
  },
  bankChip: {
    fontSize: '0.6rem',
    fontWeight: '700',
    background: 'rgba(46, 125, 50, 0.15)',
    color: 'var(--color-money-accent)',
    padding: '1px 5px',
    borderRadius: '4px',
  },
  propSets: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  propBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '2px 6px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.15)',
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'white',
  },
  propDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
  completeBadge: {
    fontSize: '0.55rem',
    marginLeft: '1px',
  },
  wildTag: {
    fontSize: '0.55rem',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
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
            <span style={s.bankValue}>${bankTotal}M</span>
            <div style={s.bankCards}>
              {player.bank.map(c => (
                <span key={c.id} style={s.bankChip}>${c.value}M</span>
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
          <div style={s.propSets}>
            {propEntries.map(([color, cards]) => {
              const config = { brown: 2, lightblue: 3, pink: 3, orange: 3, red: 3, yellow: 3, green: 3, darkblue: 2, railroad: 4, utility: 2 }
              const needed = config[color] || 3
              const standardCount = cards.filter(c => c.type === 'property').length
              const wildCount = cards.filter(c => c.type === 'wild').length
              const isComplete = cards.length >= needed && standardCount > 0
              const hasHouse = player.houses?.[color]
              const hasHotel = player.hotels?.[color]
              return (
                <div
                  key={color}
                  style={{
                    ...s.propBadge,
                    background: isComplete ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                    borderColor: isComplete ? 'var(--color-success)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ ...s.propDot, background: COLOR_CSS[color] || '#999' }} />
                  {standardCount}
                  {wildCount > 0 && <span style={s.wildTag}>+{wildCount}W</span>}
                  /{needed}
                  {isComplete && <span style={s.completeBadge}>&#10003;</span>}
                  {hasHouse && !hasHotel && <span style={s.completeBadge}>🏠</span>}
                  {hasHotel && <span style={s.completeBadge}>🏨</span>}
                </div>
              )
            })}
          </div>
        ) : (
          <span style={s.emptyText}>None</span>
        )}
      </div>
    </div>
  )
}

export default PlayerZone
