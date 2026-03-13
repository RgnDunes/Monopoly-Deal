import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, { autoConnect: false })
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

export function createRoom(playerName) {
  return new Promise((resolve, reject) => {
    const s = connectSocket()
    s.emit('create-room', { playerName }, (response) => {
      if (response.error) reject(new Error(response.error))
      else resolve(response)
    })
  })
}

export function joinRoom(roomCode, playerName) {
  return new Promise((resolve, reject) => {
    const s = connectSocket()
    s.emit('join-room', { roomCode, playerName }, (response) => {
      if (response.error) reject(new Error(response.error))
      else resolve(response)
    })
  })
}

export function startGame() {
  return new Promise((resolve, reject) => {
    const s = getSocket()
    s.emit('start-game', null, (response) => {
      if (response.error) reject(new Error(response.error))
      else resolve(response)
    })
  })
}

export function sendAction(action) {
  return new Promise((resolve, reject) => {
    const s = getSocket()
    s.emit('game-action', action, (response) => {
      if (response.error) reject(new Error(response.error))
      else resolve(response)
    })
  })
}
