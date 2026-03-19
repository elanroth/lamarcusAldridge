import React from 'react'
import { useDraft } from '../context/DraftContext'

function fmt(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const TYPE_LABEL = { purchased: 'Drafted', keeper: 'Keeper', rookie_keeper: 'Rookie' }
const TYPE_CLASS = { purchased: '', keeper: 'log-keeper', rookie_keeper: 'log-rookie' }

export default function DraftLog() {
  const { state } = useDraft()
  const picks = state.picks || []
  const teamMap = Object.fromEntries(state.teams.map(t => [t.id, t.name]))

  if (picks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h2>No picks yet</h2>
        <p>Every drafted player will appear here in order.</p>
      </div>
    )
  }

  return (
    <div className="draft-log-wrapper">
      <div className="draft-log-header">
        <span className="draft-log-title">{picks.length} picks</span>
      </div>
      <div className="table-scroll">
        <table className="player-table draft-log-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Team</th>
              <th>Price</th>
              <th>Slot</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {[...picks].reverse().map((pick, i) => (
              <tr key={pick.id} className={TYPE_CLASS[pick.type]}>
                <td className="num-cell log-pick-num">{picks.length - i}</td>
                <td className="log-time">{fmt(pick.timestamp)}</td>
                <td className="player-name">{pick.playerName}</td>
                <td><span className="pos-badge">{pick.position}</span></td>
                <td>{teamMap[pick.teamId] ?? '—'}</td>
                <td className="num-cell">${pick.price}</td>
                <td>{pick.rosterSlot ? <span className="slot-badge">{pick.rosterSlot}</span> : <span className="log-na">—</span>}</td>
                <td><span className={`log-type-badge ${TYPE_CLASS[pick.type]}`}>{TYPE_LABEL[pick.type]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
