const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const setupEvents = require('./events')

const app = express()
const server = http.createServer(app)

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://rgndunes.github.io',
]

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

setupEvents(io)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Monopoly Deal server running on port ${PORT}`)
})
