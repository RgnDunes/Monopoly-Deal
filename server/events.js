const Room = require('./Room')

const rooms = new Map()

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function setupEvents(io) {
  io.on('connection', (socket) => {
    let currentRoom = null
    let playerIndex = -1

    socket.on('create-room', ({ playerName }, callback) => {
      let code = generateRoomCode()
      while (rooms.has(code)) code = generateRoomCode()
      const room = new Room(code)
      const result = room.addPlayer(socket.id, playerName)
      if (result.error) return callback({ error: result.error })
      rooms.set(code, room)
      currentRoom = code
      playerIndex = result.index
      socket.join(code)
      callback({ roomCode: code, playerIndex })
    })

    socket.on('join-room', ({ roomCode, playerName }, callback) => {
      const room = rooms.get(roomCode)
      if (!room) return callback({ error: 'Room not found' })
      const result = room.addPlayer(socket.id, playerName)
      if (result.error) return callback({ error: result.error })
      currentRoom = roomCode
      playerIndex = result.index
      socket.join(roomCode)
      io.to(roomCode).emit('room-update', {
        players: room.players.map(p => ({ name: p.name, index: p.index })),
      })
      callback({ roomCode, playerIndex })
    })

    socket.on('start-game', (_, callback) => {
      if (!currentRoom) return callback({ error: 'Not in a room' })
      const room = rooms.get(currentRoom)
      if (!room) return callback({ error: 'Room not found' })
      if (playerIndex !== 0) return callback({ error: 'Only host can start' })
      const result = room.startGame()
      if (result.error) return callback({ error: result.error })
      // Send each player their own sanitized view
      for (const p of room.players) {
        const sock = io.sockets.sockets.get(p.socketId)
        if (sock) {
          sock.emit('game-state', room.getStateForPlayer(p.index))
        }
      }
      callback({ success: true })
    })

    socket.on('game-action', (action, callback) => {
      if (!currentRoom) return callback({ error: 'Not in a room' })
      const room = rooms.get(currentRoom)
      if (!room) return callback({ error: 'Room not found' })
      const result = room.applyAction(playerIndex, action)
      if (result.error) return callback({ error: result.error })
      // Broadcast updated state to all players
      for (const p of room.players) {
        const sock = io.sockets.sockets.get(p.socketId)
        if (sock) {
          sock.emit('game-state', room.getStateForPlayer(p.index))
        }
      }
      callback({ success: true })
    })

    socket.on('disconnect', () => {
      if (currentRoom) {
        const room = rooms.get(currentRoom)
        if (room) {
          room.removePlayer(socket.id)
          if (room.players.length === 0) {
            rooms.delete(currentRoom)
          } else {
            io.to(currentRoom).emit('room-update', {
              players: room.players.map(p => ({ name: p.name, index: p.index })),
            })
            io.to(currentRoom).emit('player-left', { playerIndex })
          }
        }
      }
    })
  })
}

module.exports = setupEvents
