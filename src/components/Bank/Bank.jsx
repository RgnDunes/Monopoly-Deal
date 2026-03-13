import Card from '../Card/Card.jsx'
import styles from './Bank.module.css'

function Bank({ cards = [], onCardClick }) {
  const total = cards.reduce((sum, c) => sum + (c.value || 0), 0)

  return (
    <div className={styles.bank}>
      <span className={styles.bankLabel}>Bank</span>
      <span className={styles.bankTotal}>${total}M</span>
      {cards.length > 0 && (
        <div className={styles.bankCards}>
          {cards.map(card => (
            <Card
              key={card.id}
              card={card}
              size="sm"
              onClick={() => onCardClick?.(card)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Bank
