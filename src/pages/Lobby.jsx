import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'
import useUIStore from '../store/uiStore.js'
import { connectSocket, createRoom, joinRoom, startGame as startMultiplayerGame } from '../services/socket.js'

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
    marginBottom: '24px',
  },
  card: {
    background: 'var(--bg-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid var(--color-border)',
    marginBottom: '16px',
  },
  roomCode: {
    fontSize: '2rem',
    fontWeight: '900',
    color: 'var(--color-warning)',
    textAlign: 'center',
    letterSpacing: '4px',
    marginBottom: '16px',
  },
  playerList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 16px 0',
  },
  playerItem: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    fontSize: '0.9rem',
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
    marginBottom: '12px',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-game)',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '8px',
  },
  backButton: {
    padding: '8px 20px',
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-game)',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    marginBottom: '4px',
  },
  hostBadge: {
    fontSize: '0.7rem',
    color: 'var(--color-warning)',
    marginLeft: '8px',
  },
}

function Lobby() {
  const { roomCode: urlRoomCode } = useParams()
  const navigate = useNavigate()
  const setGame = useGameStore(s => s.setGame)
  const setMyPlayerIndex = useGameStore(s => s.setMyPlayerIndex)
  const addToast = useUIStore(s => s.addToast)

  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState(urlRoomCode || '')
  const [joined, setJoined] = useState(false)
  const [players, setPlayers] = useState([])
  const [myIndex, setMyIndex] = useState(-1)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  useEffect(() => {
    const socket = connectSocket()

    socket.on('connect', () => {
      setConnectionStatus('connected')
    })

    socket.on('connect_error', () => {
      setConnectionStatus('failed')
      addToast('Could not connect to game server. Make sure it is running.', 'error')
    })

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected')
    })

    socket.on('room-update', ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers)
    })

    socket.on('game-state', (state) => {
      setGame(state)
      navigate(`/game/${roomCode}`)
    })

    socket.on('player-left', ({ playerIndex }) => {
      addToast(`Player ${playerIndex + 1} left the game`, 'warning')
    })

    return () => {
      socket.off('connect')
      socket.off('connect_error')
      socket.off('disconnect')
      socket.off('room-update')
      socket.off('game-state')
      socket.off('player-left')
    }
  }, [roomCode, setGame, navigate, addToast])

  const handleCreate = async () => {
    const name = playerName.trim() || 'Player 1'
    try {
      const result = await createRoom(name)
      setRoomCode(result.roomCode)
      setMyIndex(result.playerIndex)
      setMyPlayerIndex(result.playerIndex)
      setJoined(true)
      setPlayers([{ name, index: result.playerIndex }])
      addToast(`Room ${result.roomCode} created!`, 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleJoin = async () => {
    const name = playerName.trim() || 'Player'
    const code = roomCode.trim().toUpperCase()
    if (!code) return addToast('Enter a room code', 'warning')
    try {
      const result = await joinRoom(code, name)
      setRoomCode(result.roomCode)
      setMyIndex(result.playerIndex)
      setMyPlayerIndex(result.playerIndex)
      setJoined(true)
      addToast(`Joined room ${result.roomCode}`, 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const handleStart = async () => {
    try {
      await startMultiplayerGame()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const isFailed = connectionStatus === 'failed'
  const statusColor = connectionStatus === 'connected' ? 'var(--color-success)' : isFailed ? 'var(--color-danger)' : 'var(--color-warning)'
  const statusText = connectionStatus === 'connected' ? 'Connected' : isFailed ? 'Server unavailable' : 'Connecting...'

  if (!joined) {
    return (
      <div style={lobbyStyles.container}>
        <div style={lobbyStyles.title}>Multiplayer</div>
        <div style={{ fontSize: '0.75rem', color: statusColor, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
          {statusText}
        </div>
        <div style={lobbyStyles.card}>
          <label style={lobbyStyles.label}>Your Name</label>
          <input
            style={lobbyStyles.input}
            placeholder="Enter your name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
          />
          <button style={lobbyStyles.button} onClick={handleCreate}>
            Create Room
          </button>
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', margin: '12px 0', fontSize: '0.85rem' }}>
            — or —
          </div>
          <label style={lobbyStyles.label}>Room Code</label>
          <input
            style={lobbyStyles.input}
            placeholder="ABCD"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            maxLength={4}
          />
          <button style={lobbyStyles.button} onClick={handleJoin}>
            Join Room
          </button>
        </div>
        <button style={lobbyStyles.backButton} onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div style={lobbyStyles.container}>
      <div style={lobbyStyles.title}>Lobby</div>
      <div style={lobbyStyles.card}>
        <div style={lobbyStyles.roomCode}>{roomCode}</div>
        <label style={lobbyStyles.label}>Players ({players.length}/5)</label>
        <ul style={lobbyStyles.playerList}>
          {players.map((p) => (
            <li key={p.index} style={lobbyStyles.playerItem}>
              {p.name}
              {p.index === 0 && <span style={lobbyStyles.hostBadge}>HOST</span>}
              {p.index === myIndex && ' (you)'}
            </li>
          ))}
        </ul>
        {myIndex === 0 && players.length >= 2 && (
          <button style={lobbyStyles.button} onClick={handleStart}>
            Start Game
          </button>
        )}
        {myIndex === 0 && players.length < 2 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Waiting for more players...
          </div>
        )}
        {myIndex !== 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Waiting for host to start...
          </div>
        )}
      </div>
      <button style={lobbyStyles.backButton} onClick={() => navigate('/')}>
        Leave
      </button>
    </div>
  )
}

export default Lobby
