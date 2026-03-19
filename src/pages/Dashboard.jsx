import React, { useState, useEffect } from 'react'
import { useDraft } from '../context/DraftContext'
import PlayerTable from '../components/PlayerTable'
import TeamOverview from '../components/TeamOverview'
import StandingsPanel from '../components/StandingsPanel'
import DraftLog from '../components/DraftLog'
import CSVImport from '../components/CSVImport'
import AddTeamModal from '../components/AddTeamModal'
import AddKeeperModal from '../components/AddKeeperModal'
import AssignPlayerModal from '../components/AssignPlayerModal'

export default function Dashboard() {
  const { state, dispatch } = useDraft()
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [showAddKeeper, setShowAddKeeper] = useState(false)
  const [dropAssign, setDropAssign] = useState(null) // { player, teamId }
  const [view, setView] = useState('players')

  const picks = state.picks || []

  useEffect(() => {
    if (picks.length === 0) return
    function handler(e) { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [picks.length])

  const availablePlayers = state.players.filter(p => p.status === 'available')

  function handlePlayerDrop(playerId, teamId) {
    const player = state.players.find(p => p.id === playerId)
    if (!player) return
    setDropAssign({ player, teamId })
  }

  function handleUndo() {
    if (picks.length === 0) return
    const last = picks[picks.length - 1]
    if (window.confirm(`Undo: ${last.playerName} → ${state.teams.find(t => t.id === last.teamId)?.name} ($${last.price})?`)) {
      dispatch({ type: 'UNDO_LAST_PICK' })
    }
  }

  function handleExport() {
    const rows = [['Team', 'Player', 'Position', 'Slot', 'Type', 'Price', 'Proj $', 'Delta']]
    for (const team of state.teams) {
      const teamPlayers = state.players.filter(p => p.teamId === team.id)
      for (const p of teamPlayers) {
        const delta = p.dollarValue != null ? (p.dollarValue - p.purchasedPrice).toFixed(0) : ''
        rows.push([team.name, p.name, p.position, p.rosterSlot || '', p.status, p.purchasedPrice ?? '', p.dollarValue != null ? p.dollarValue.toFixed(0) : '', delta])
      }
    }
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'auction-draft.csv',
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function handleResetDraft() {
    if (window.confirm('Reset all draft picks and keeper assignments? Teams will remain but all players return to available.')) {
      dispatch({ type: 'RESET_DRAFT' })
    }
  }

  function handleClearAll() {
    if (window.confirm('Clear all teams and draft picks? Players and projections will remain.')) {
      dispatch({ type: 'CLEAR_ALL' })
    }
  }

  function handleLoadSample() {
    if (state.players.length > 0 && !window.confirm('Replace existing players with sample data?')) return
    dispatch({ type: 'SEED_PLAYERS' })
  }

  function handleSeedTeams() {
    if (state.teams.length > 0 && !window.confirm('Replace existing teams with 10 default teams?')) return
    dispatch({ type: 'SEED_TEAMS' })
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="app-title">⚾ Auction Draft</h1>
          <span className="player-count">{availablePlayers.length} available</span>
        </div>
        <div className="topbar-right">
          <div className="view-toggle">
            <button
              className={`btn btn-sm ${view === 'players' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setView('players')}
            >
              Players
            </button>
            <button
              className={`btn btn-sm ${view === 'standings' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setView('standings')}
            >
              Standings
            </button>
            <button
              className={`btn btn-sm ${view === 'log' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setView('log')}
            >
              Log {picks.length > 0 && <span className="log-count">{picks.length}</span>}
            </button>
          </div>
          <div className="divider-v" />
          <CSVImport />
          <button className="btn btn-accent" onClick={() => setShowAddKeeper(true)}>
            + Add Keeper
          </button>
          <button className="btn btn-secondary" onClick={handleSeedTeams}>
            Seed 10 Teams
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAddTeam(true)}>
            + Add Team
          </button>
          <div className="divider-v" />
          <button className="btn btn-ghost btn-sm" onClick={handleExport} title="Export draft to CSV">
            Export
          </button>
          {picks.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleUndo} title="Undo last pick">
              Undo
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleResetDraft}>
            Reset Draft
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleClearAll}>
            Clear All
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        <main className="dashboard-main">
          {view === 'log' ? (
            <DraftLog />
          ) : view === 'standings' ? (
            <StandingsPanel />
          ) : state.players.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h2>No Players Loaded</h2>
              <p>Import a CSV file to get started. The CSV should have columns for:<br />
                <code>Name, Position, Projected Value, Dollar Value</code>
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <CSVImport />
                <button className="btn btn-ghost" onClick={handleLoadSample}>
                  Load Sample Players
                </button>
              </div>
            </div>
          ) : (
            <PlayerTable players={availablePlayers} />
          )}
        </main>

        <aside className="dashboard-sidebar">
          <TeamOverview onPlayerDrop={handlePlayerDrop} />
        </aside>
      </div>

      {showAddTeam && <AddTeamModal onClose={() => setShowAddTeam(false)} />}
      {showAddKeeper && <AddKeeperModal onClose={() => setShowAddKeeper(false)} />}
      {dropAssign && (
        <AssignPlayerModal
          player={dropAssign.player}
          preselectedTeamId={dropAssign.teamId}
          onClose={() => setDropAssign(null)}
        />
      )}
    </div>
  )
}
