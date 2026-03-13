import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'
import GameBoard from '../components/GameBoard/GameBoard.jsx'
import TurnIndicator from '../components/HUD/TurnIndicator.jsx'
import Toast from '../components/HUD/Toast.jsx'
import WildColorModal from '../components/Modals/WildColorModal.jsx'
import ActionChoiceModal from '../components/Modals/ActionChoiceModal.jsx'
import TargetSelectModal from '../components/Modals/TargetSelectModal.jsx'
import PayDebtModal from '../components/Modals/PayDebtModal.jsx'
import JustSayNoModal from '../components/Modals/JustSayNoModal.jsx'
import PassDeviceModal from '../components/Modals/PassDeviceModal.jsx'
import WinScreen from '../components/WinScreen/WinScreen.jsx'
import useBotTurns from '../hooks/useBotTurns.js'

function Game() {
  const game = useGameStore(s => s.game)
  const navigate = useNavigate()
  useBotTurns()

  useEffect(() => {
    if (!game) {
      navigate('/')
    }
  }, [game, navigate])

  if (!game) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontFamily: 'var(--font-game)' }}>Redirecting...</div>

  return (
    <>
      <TurnIndicator />
      <GameBoard />
      <Toast />
      <WildColorModal />
      <ActionChoiceModal />
      <TargetSelectModal />
      <PayDebtModal />
      <JustSayNoModal />
      <PassDeviceModal />
      <WinScreen />
    </>
  )
}

export default Game
