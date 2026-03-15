import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ReactConfetti from 'react-confetti'
import useGameStore from '../../store/gameStore.js'
import styles from './WinScreen.module.css'

const WIN_MEMES = [
  { url: 'https://i.imgflip.com/2/1bhf.jpg', alt: 'Deal with it' },
  { url: 'https://i.imgflip.com/2/26am.jpg', alt: 'Success Kid' },
  { url: 'https://i.imgflip.com/2/1bh8.jpg', alt: 'Aww yeah' },
  { url: 'https://i.imgflip.com/2/1bij.jpg', alt: 'Thumbs up' },
  { url: 'https://i.imgflip.com/2/1otk96.jpg', alt: 'Roll Safe think about it' },
]

const LOSER_MEMES = [
  { url: 'https://i.imgflip.com/2/21uy0f.jpg', alt: 'Crying Michael Jordan' },
  { url: 'https://i.imgflip.com/2/2cp1.jpg', alt: 'Waiting skeleton' },
  { url: 'https://i.imgflip.com/2/261o.jpg', alt: 'First time?' },
]

function WinScreen() {
  const game = useGameStore(s => s.game)
  const resetGame = useGameStore(s => s.resetGame)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [meme] = useState(() => {
    const pool = Math.random() > 0.3 ? WIN_MEMES : LOSER_MEMES
    return pool[Math.floor(Math.random() * pool.length)]
  })

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!game || game.winner === null || game.winner === undefined) return null

  const winner = game.players[game.winner]

  return (
    <motion.div
      className={styles.winOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ReactConfetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={true}
        numberOfPieces={300}
        gravity={0.15}
        colors={['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#ec4899', '#3b82f6']}
      />
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', delay: 0.3, damping: 8 }}
      >
        <div className={styles.winTitle}>Victory!</div>
      </motion.div>
      <motion.div
        className={styles.winnerName}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {winner?.name || 'Unknown'} wins!
      </motion.div>
      <motion.div
        className={styles.memeContainer}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: 'spring', damping: 10 }}
      >
        <img
          src={meme.url}
          alt={meme.alt}
          className={styles.memeImage}
          crossOrigin="anonymous"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </motion.div>
      <motion.button
        className={styles.playAgainButton}
        onClick={resetGame}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Play Again
      </motion.button>
    </motion.div>
  )
}

export default WinScreen
