import { useNavigate } from 'react-router-dom'

const lobbyStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontFamily: 'var(--font-game)',
    padding: '24px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--color-text)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)',
    marginBottom: '24px',
  },
  backButton: {
    padding: '10px 24px',
    background: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-game)',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
}

function Lobby() {
  const navigate = useNavigate()

  return (
    <div style={lobbyStyles.container}>
      <div style={lobbyStyles.title}>Multiplayer Lobby</div>
      <div style={lobbyStyles.subtitle}>Coming soon! For now, try a local game.</div>
      <button style={lobbyStyles.backButton} onClick={() => navigate('/')}>
        Back to Home
      </button>
    </div>
  )
}

export default Lobby
