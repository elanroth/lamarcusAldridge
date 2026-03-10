import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDraft } from '../context/DraftContext'
import { remainingBudget } from '../utils/helpers'
import { TOTAL_BUDGET, ROSTER_SLOT_DEFINITIONS } from '../utils/constants'

export default function TeamPage() {
  const { teamId } = useParams()
  const { state, dispatch } = useDraft()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  const team = state.teams.find(t => t.id === teamId)
  if (!team) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Team not found.</h2>
          <Link to="/" className="btn btn-primary">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const teamPlayers = state.players.filter(p => p.teamId === teamId)
  const rosterPlayers = teamPlayers.filter(p => p.status !== 'rookie_keeper')
  const remaining = remainingBudget(team, state.players)
  const spent = TOTAL_BUDGET - remaining

  function handleUnassign(playerId) {
    if (window.confirm('Remove this player from the roster and return them to available?')) {
      dispatch({ type: 'UNASSIGN_PLAYER', playerId })
    }
  }

  function handleRenameSubmit(e) {
    e.preventDefault()
    if (nameInput.trim()) {
      dispatch({ type: 'RENAME_TEAM', teamId, name: nameInput.trim() })
    }
    setEditingName(false)
  }

  function handleRemoveTeam() {
    if (window.confirm(`Remove "${team.name}" and release all their players?`)) {
      dispatch({ type: 'REMOVE_TEAM', teamId })
      window.history.back()
    }
  }

  // Build roster slot display (excludes rookie keepers)
  const batterRows = []
  const pitcherRows = []
  for (const def of ROSTER_SLOT_DEFINITIONS) {
    const playersInSlot = rosterPlayers.filter(p => p.rosterSlot === def.slot)
    const target = def.slot === 'P' ? pitcherRows : batterRows
    for (let i = 0; i < def.count; i++) {
      const player = playersInSlot[i] || null
      target.push({ slot: def.slot, label: def.label, player })
    }
  }

  const keepers = teamPlayers.filter(p => p.status === 'keeper')
  const purchased = teamPlayers.filter(p => p.status === 'purchased')
  const rookieKeepers = teamPlayers.filter(p => p.status === 'rookie_keeper')

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-left">
          <Link to="/" className="back-link">← Dashboard</Link>
          {editingName ? (
            <form onSubmit={handleRenameSubmit} className="rename-form">
              <input
                className="input rename-input"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-sm btn-primary">Save</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditingName(false)}>Cancel</button>
            </form>
          ) : (
            <h1 className="app-title" onClick={() => { setNameInput(team.name); setEditingName(true) }} title="Click to rename" style={{ cursor: 'pointer' }}>
              {team.name}
            </h1>
          )}
        </div>
        <div className="topbar-right">
          <button className="btn btn-danger btn-sm" onClick={handleRemoveTeam}>
            Remove Team
          </button>
        </div>
      </header>

      <div className="team-page-layout">

        {/* Budget Summary */}
        <div className="budget-summary-card">
          <div className="budget-stat">
            <span className="budget-label">Total Budget</span>
            <span className="budget-value">${TOTAL_BUDGET}</span>
          </div>
          <div className="budget-stat">
            <span className="budget-label">Spent</span>
            <span className="budget-value spent">${spent}</span>
          </div>
          <div className="budget-stat">
            <span className="budget-label">Remaining</span>
            <span className={`budget-value ${remaining < 20 ? 'low' : 'remaining'}`}>${remaining}</span>
          </div>
          <div className="budget-stat">
            <span className="budget-label">Roster</span>
            <span className="budget-value">{rosterPlayers.length}/23</span>
            {rookieKeepers.length > 0 && (
              <span className="budget-rookies-note">+{rookieKeepers.length} rookie{rookieKeepers.length > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        <div className="team-content">

          {/* Roster Grid */}
          <section className="roster-section">
            <h2 className="section-title">Roster</h2>
            <div className="roster-grid">
              {batterRows.map((row, i) => (
                <div key={i} className={`roster-slot ${row.player ? 'filled' : 'empty'} ${row.player?.status === 'keeper' ? 'keeper' : ''}`}>
                  <div className="roster-slot-label">{row.label}</div>
                  {row.player ? (
                    <div className="roster-slot-player">
                      <div className="roster-player-name">{row.player.name}</div>
                      <div className="roster-player-meta">
                        <span className="pos-badge">{row.player.position}</span>
                        <span className="roster-price">${row.player.purchasedPrice}</span>
                        {row.player.status === 'keeper' && <span className="keeper-tag">K</span>}
                      </div>
                      <button
                        className="roster-remove-btn"
                        onClick={() => handleUnassign(row.player.id)}
                        title="Remove from roster"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="roster-slot-empty">Empty</div>
                  )}
                </div>
              ))}
            </div>
            <div className="roster-divider"><span>Pitchers</span></div>
            <div className="roster-grid">
              {pitcherRows.map((row, i) => (
                <div key={i} className={`roster-slot ${row.player ? 'filled' : 'empty'} ${row.player?.status === 'keeper' ? 'keeper' : ''}`}>
                  <div className="roster-slot-label">{row.label}</div>
                  {row.player ? (
                    <div className="roster-slot-player">
                      <div className="roster-player-name">{row.player.name}</div>
                      <div className="roster-player-meta">
                        <span className="pos-badge">{row.player.position}</span>
                        <span className="roster-price">${row.player.purchasedPrice}</span>
                        {row.player.status === 'keeper' && <span className="keeper-tag">K</span>}
                      </div>
                      <button
                        className="roster-remove-btn"
                        onClick={() => handleUnassign(row.player.id)}
                        title="Remove from roster"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="roster-slot-empty">Empty</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Purchased Players List */}
          <section className="players-section">
            <h2 className="section-title">Purchased ({purchased.length})</h2>
            {purchased.length === 0 ? (
              <p className="empty-hint">No players drafted yet.</p>
            ) : (
              <table className="player-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Pos</th>
                    <th>Slot</th>
                    <th>Price</th>
                    <th>Proj $</th>
                    <th>Delta</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {purchased.map(p => {
                    const delta = p.dollarValue != null ? p.dollarValue - p.purchasedPrice : null
                    return (
                      <tr key={p.id}>
                        <td className="player-name">{p.name}</td>
                        <td><span className="pos-badge">{p.position}</span></td>
                        <td><span className="slot-badge">{p.rosterSlot}</span></td>
                        <td className="num-cell">${p.purchasedPrice}</td>
                        <td className="num-cell">{p.dollarValue != null ? `$${p.dollarValue.toFixed(0)}` : '—'}</td>
                        <td className={`num-cell delta ${delta == null ? '' : delta >= 0 ? 'positive' : 'negative'}`}>
                          {delta == null ? '—' : `${delta >= 0 ? '+' : ''}$${delta.toFixed(0)}`}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-ghost" onClick={() => handleUnassign(p.id)}>
                            Release
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* Keepers List */}
          {keepers.length > 0 && (
            <section className="players-section">
              <h2 className="section-title">Keepers ({keepers.length})</h2>
              <table className="player-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Pos</th>
                    <th>Slot</th>
                    <th>Keeper Price</th>
                    <th>Proj $</th>
                    <th>Savings</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {keepers.map(p => {
                    const savings = p.dollarValue != null ? p.dollarValue - p.purchasedPrice : null
                    return (
                      <tr key={p.id} className="keeper-row">
                        <td className="player-name">{p.name}</td>
                        <td><span className="pos-badge">{p.position}</span></td>
                        <td><span className="slot-badge">{p.rosterSlot}</span></td>
                        <td className="num-cell">${p.purchasedPrice}</td>
                        <td className="num-cell">{p.dollarValue != null ? `$${p.dollarValue.toFixed(0)}` : '—'}</td>
                        <td className={`num-cell delta ${savings == null ? '' : savings >= 0 ? 'positive' : 'negative'}`}>
                          {savings == null ? '—' : `${savings >= 0 ? '+' : ''}$${savings.toFixed(0)}`}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-ghost" onClick={() => handleUnassign(p.id)}>
                            Release
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          )}

          {/* Rookie Keepers */}
          {rookieKeepers.length > 0 && (
            <section className="players-section">
              <h2 className="section-title rookie-keeper-title">Rookie Keepers ({rookieKeepers.length})</h2>
              <table className="player-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Pos</th>
                    <th>Keeper Price</th>
                    <th>Proj $</th>
                    <th>Savings</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rookieKeepers.map(p => {
                    const savings = p.dollarValue != null ? p.dollarValue - p.purchasedPrice : null
                    return (
                      <tr key={p.id} className="rookie-keeper-row">
                        <td className="player-name">{p.name}</td>
                        <td><span className="pos-badge">{p.position}</span></td>
                        <td className="num-cell">${p.purchasedPrice}</td>
                        <td className="num-cell">{p.dollarValue != null ? `$${p.dollarValue.toFixed(0)}` : '—'}</td>
                        <td className={`num-cell delta ${savings == null ? '' : savings >= 0 ? 'positive' : 'negative'}`}>
                          {savings == null ? '—' : `${savings >= 0 ? '+' : ''}$${savings.toFixed(0)}`}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-ghost" onClick={() => handleUnassign(p.id)}>
                            Release
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
