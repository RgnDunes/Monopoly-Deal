import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
const EMIT_TIMEOUT = 8000

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      timeout: 5000,
      reconnectionAttempts: 3,
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

function emitWithTimeout(socket, event, data) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Server not responding. Is the game server running?'))
    }, EMIT_TIMEOUT)

    socket.emit(event, data, (response) => {
      clearTimeout(timer)
      if (response.error) reject(new Error(response.error))
      else resolve(response)
    })
  })
}

export function createRoom(playerName) {
  const s = connectSocket()
  return emitWithTimeout(s, 'create-room', { playerName })
}

export function joinRoom(roomCode, playerName) {
  const s = connectSocket()
  return emitWithTimeout(s, 'join-room', { roomCode, playerName })
}

export function startGame() {
  const s = getSocket()
  return emitWithTimeout(s, 'start-game', null)
}

export function sendAction(action) {
  const s = getSocket()
  return emitWithTimeout(s, 'game-action', action)
}
