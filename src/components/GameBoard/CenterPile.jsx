import Card from '../Card/Card.jsx'
import styles from './GameBoard.module.css'

function CenterPile({ deckCount = 0, topDiscard = null, isDrawPhase = false, onDraw }) {
  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div className={styles.deckPile}>
        <div
          onClick={isDrawPhase ? onDraw : undefined}
          style={{ cursor: isDrawPhase ? 'pointer' : 'default' }}
        >
          <Card card={{ id: 'deck', type: 'money', name: 'Deck', value: 0 }} faceDown size="md" />
        </div>
        <span className={styles.deckCount}>{deckCount} cards</span>
      </div>
      <div className={styles.discardPile}>
        {topDiscard ? (
          <Card card={topDiscard} size="md" disabled />
        ) : (
          <div className={styles.emptyDiscard}>Discard</div>
        )}
        <span className={styles.discardLabel}>Discard</span>
      </div>
    </div>
  )
}

export default CenterPile
