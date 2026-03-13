import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'
import GameBoard from '../components/GameBoard/GameBoard.jsx'
import TurnIndicator from '../components/HUD/TurnIndicator.jsx'
import Toast from '../components/HUD/Toast.jsx'
import WildColorModal from '../components/Modals/WildColorModal.jsx'
import TargetSelectModal from '../components/Modals/TargetSelectModal.jsx'
import PayDebtModal from '../components/Modals/PayDebtModal.jsx'
import JustSayNoModal from '../components/Modals/JustSayNoModal.jsx'
import PassDeviceModal from '../components/Modals/PassDeviceModal.jsx'
import WinScreen from '../components/WinScreen/WinScreen.jsx'

function Game() {
  const game = useGameStore(s => s.game)
  const navigate = useNavigate()

  useEffect(() => {
    if (!game) {
      navigate('/')
    }
  }, [game, navigate])

  if (!game) return null

  return (
    <>
      <TurnIndicator />
      <GameBoard />
      <Toast />
      <WildColorModal />
      <TargetSelectModal />
      <PayDebtModal />
      <JustSayNoModal />
      <PassDeviceModal />
      <WinScreen />
    </>
  )
}

export default Game
