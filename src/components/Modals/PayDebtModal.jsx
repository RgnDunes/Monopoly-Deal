import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useUIStore from '../../store/uiStore.js'
import useGameStore from '../../store/gameStore.js'
import styles from './Modals.module.css'

function PayDebtModal() {
  const game = useGameStore(s => s.game)
  const pendingPayments = useGameStore(s => s.pendingPayments)
  const processPayment = useGameStore(s => s.processPayment)
  const skipPayment = useGameStore(s => s.skipPayment)
  const jsnForPayment = useGameStore(s => s.useJSNForPayment)
  const addToast = useUIStore(s => s.addToast)
  const [selectedIds, setSelectedIds] = useState([])
  const prevPaymentRef = useRef(null)

  const payment = pendingPayments[0]

  // Reset selection when payment changes (derive from render, not effect)
  const paymentKey = payment ? `${payment.fromIndex}-${payment.amount}` : null
  if (paymentKey !== prevPaymentRef.current) {
    prevPaymentRef.current = paymentKey
    if (selectedIds.length > 0) setSelectedIds([])
  }

  if (!payment || !game) return null

  const payer = game.players[payment.fromIndex]
  const collector = game.players[payment.toIndex]
  if (!payer) return null

  const amountOwed = payment.amount || 0

  const allPayableCards = [
    ...payer.bank.map(c => ({ ...c, source: 'bank' })),
    ...Object.entries(payer.properties).flatMap(([color, cards]) =>
      cards.map(c => ({ ...c, source: 'property', fromColor: color }))
    ),
  ]

  // If payer has nothing, auto-skip
  if (allPayableCards.length === 0) {
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
          <div className={styles.modalTitle}>{payer.name} owes ${amountOwed}M</div>
          <div className={styles.modalSubtitle}>{payer.name} has nothing to pay with!</div>
          <button
            className={styles.primaryButton}
            onClick={() => {
              addToast(`${payer.name} has no cards to pay`, 'warning')
              skipPayment()
            }}
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    )
  }

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
        <div className={styles.modalTitle}>{payer.name} — Pay ${amountOwed}M to {collector.name}</div>
        <div className={styles.modalSubtitle}>Select cards to pay with (no change given)</div>
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
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            className={styles.primaryButton}
            disabled={!canPay}
            onClick={() => {
              processPayment(payment.fromIndex, payment.toIndex, selectedIds)
              addToast(`${payer.name} paid $${selectedTotal}M to ${collector.name}`, 'success')
            }}
          >
            Pay
          </button>
          {payer.hand.some(c => c.name?.toLowerCase() === 'just say no') && (
            <button
              className={styles.jsnBlock || styles.primaryButton}
              style={{ background: 'var(--color-danger)' }}
              onClick={() => {
                jsnForPayment(payment.fromIndex)
                addToast(`${payer.name} played Just Say No!`, 'warning')
              }}
            >
              Just Say No!
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PayDebtModal
