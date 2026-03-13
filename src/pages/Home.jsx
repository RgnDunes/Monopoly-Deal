import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'

const homeStyles = {
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
    fontSize: '2.5rem',
    fontWeight: '900',
    color: 'var(--color-warning)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--color-text-muted)',
    marginBottom: '32px',
  },
  card: {
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid var(--color-border)',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--color-text)',
    marginBottom: '16px',
  },
  inputGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-game)',
    fontSize: '0.9rem',
    outline: 'none',
  },
  playerControls: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  smallButton: {
    padding: '6px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-game)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  startButton: {
    width: '100%',
    padding: '14px',
    background: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-game)',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
  },
}

function Home() {
  const [playerNames, setPlayerNames] = useState(['', ''])
  const initLocalGame = useGameStore(s => s.initLocalGame)
  const navigate = useNavigate()

  const addPlayer = () => {
    if (playerNames.length < 5) {
      setPlayerNames([...playerNames, ''])
    }
  }

  const removePlayer = () => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.slice(0, -1))
    }
  }

  const updateName = (index, name) => {
    const updated = [...playerNames]
    updated[index] = name
    setPlayerNames(updated)
  }

  const handleStart = () => {
    const names = playerNames.map((name, i) => name.trim() || `Player ${i + 1}`)
    initLocalGame(names)
    navigate('/game')
  }

  return (
    <div style={homeStyles.container}>
      <div style={homeStyles.title}>Monopoly Deal</div>
      <div style={homeStyles.subtitle}>The Card Game</div>

      <div style={homeStyles.card}>
        <div style={homeStyles.sectionTitle}>Local Game</div>

        {playerNames.map((name, i) => (
          <div key={i} style={homeStyles.inputGroup}>
            <label style={homeStyles.label}>Player {i + 1}</label>
            <input
              style={homeStyles.input}
              placeholder={`Player ${i + 1}`}
              value={name}
              onChange={e => updateName(i, e.target.value)}
            />
          </div>
        ))}

        <div style={homeStyles.playerControls}>
          <button
            style={homeStyles.smallButton}
            onClick={removePlayer}
            disabled={playerNames.length <= 2}
          >
            - Remove
          </button>
          <button
            style={homeStyles.smallButton}
            onClick={addPlayer}
            disabled={playerNames.length >= 5}
          >
            + Add Player
          </button>
        </div>

        <button style={homeStyles.startButton} onClick={handleStart}>
          Start Game
        </button>
      </div>
    </div>
  )
}

export default Home
