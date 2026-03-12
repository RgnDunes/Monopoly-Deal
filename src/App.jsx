import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Lobby from './pages/Lobby.jsx'
import Game from './pages/Game.jsx'

function App() {
  return (
    <BrowserRouter basename="/Monopoly-Deal">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:roomCode" element={<Lobby />} />
        <Route path="/game" element={<Game />} />
        <Route path="/game/:roomCode" element={<Game />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
