import { useState } from 'react'
import styles from './HUD.module.css'

function ActionLog({ entries = [] }) {
  const [collapsed, setCollapsed] = useState(false)

  if (entries.length === 0) return null

  return (
    <div className={styles.actionLog} onClick={() => setCollapsed(!collapsed)}>
      <div className={styles.logTitle}>Action Log</div>
      {!collapsed && entries.slice(-8).map((entry, i) => (
        <div key={i} className={styles.logEntry}>{entry}</div>
      ))}
    </div>
  )
}

export default ActionLog
