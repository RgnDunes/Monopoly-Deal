import { useState } from 'react'
import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import useGameStore from '../../store/gameStore.js'
import styles from './Modals.module.css'

function PayDebtModal() {
  const activeModal = useUIStore(s => s.activeModal)
  const modalData = useUIStore(s => s.modalData)
  const closeModal = useUIStore(s => s.closeModal)
  const game = useGameStore(s => s.game)
  const [selectedIds, setSelectedIds] = useState([])

  if (activeModal !== 'payDebt' || !modalData || !game) return null

  const payer = game.players[modalData.payerIndex]
  if (!payer) return null

  const amountOwed = modalData.amount || 0

  const allPayableCards = [
    ...payer.bank.map(c => ({ ...c, source: 'bank' })),
    ...Object.entries(payer.properties).flatMap(([color, cards]) =>
      cards.map(c => ({ ...c, source: 'property', fromColor: color }))
    ),
  ]

  const selectedTotal = allPayableCards
    .filter(c => selectedIds.includes(c.id))
    .reduce((s, c) => s + (c.value || 0), 0)

  const toggleCard = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const canPay = selectedTotal >= amountOwed || selectedIds.length === allPayableCards.length

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <div className={styles.modalTitle}>Pay ${amountOwed}M</div>
        <div className={styles.modalSubtitle}>Select cards to pay with</div>
        <div className={styles.playerList}>
          {allPayableCards.map(card => (
            <button
              key={card.id}
              className={styles.playerButton}
              style={{
                borderColor: selectedIds.includes(card.id) ? 'var(--color-primary)' : undefined,
                background: selectedIds.includes(card.id) ? 'rgba(99,102,241,0.15)' : undefined,
              }}
              onClick={() => toggleCard(card.id)}
            >
              {card.name} (${card.value}M) — {card.source}
            </button>
          ))}
        </div>
        <div className={styles.payTotal}>
          Selected: ${selectedTotal}M / ${amountOwed}M needed
        </div>
        <button
          className={styles.primaryButton}
          disabled={!canPay}
          onClick={() => {
            closeModal()
          }}
        >
          Pay
        </button>
      </motion.div>
    </motion.div>
  )
}

export default PayDebtModal
