import { useEffect, useRef } from 'react'
import useGameStore from '../store/gameStore.js'
import useUIStore from '../store/uiStore.js'
import { decideBotAction, applyBotAction } from '../engine/bot.js'

/**
 * Hook that watches for bot players' turns and auto-plays them.
 * Bot players are identified by names starting with "Bot" or "CPU".
 */
export default function useBotTurns() {
  const game = useGameStore(s => s.game)
  const isLocalGame = useGameStore(s => s.isLocalGame)
  const setGame = useGameStore(s => s.setGame)
  const addToast = useUIStore(s => s.addToast)
  const botTimerRef = useRef(null)

  useEffect(() => {
    if (!game || !isLocalGame || game.winner !== null) return

    const currentPlayer = game.players[game.currentPlayerIndex]
    const isBot = currentPlayer.name.toLowerCase().startsWith('bot') ||
                  currentPlayer.name.toLowerCase().startsWith('cpu')

    if (!isBot) return

    // Add a delay to make bot turns feel natural
    botTimerRef.current = setTimeout(() => {
      let current = game
      const startIndex = current.currentPlayerIndex

      for (let i = 0; i < 10; i++) {
        const action = decideBotAction(current)
        const actionName = action.type === 'draw' ? 'draws cards'
          : action.type === 'bank' ? 'banks a card'
          : action.type === 'playProperty' ? 'plays a property'
          : 'ends turn'

        current = applyBotAction(current, action)

        if (action.type !== 'endTurn') {
          addToast(`${currentPlayer.name} ${actionName}`, 'info')
        }

        if (action.type === 'endTurn') break
        if (current.currentPlayerIndex !== startIndex) break
      }

      setGame(current)
      addToast(`${currentPlayer.name} ends their turn`, 'info')
    }, 1200)

    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current)
      }
    }
  }, [game, isLocalGame, setGame, addToast])
}
