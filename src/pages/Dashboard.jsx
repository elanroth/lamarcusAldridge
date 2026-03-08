import React, { useState } from 'react'
import { useDraft } from '../context/DraftContext'
import PlayerTable from '../components/PlayerTable'
import TeamOverview from '../components/TeamOverview'
import CSVImport from '../components/CSVImport'
import AddTeamModal from '../components/AddTeamModal'
import AddKeeperModal from '../components/AddKeeperModal'
import AssignPlayerModal from '../components/AssignPlayerModal'

export default function Dashboard() {
  const { state, dispatch } = useDraft()
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [showAddKeeper, setShowAddKeeper] = useState(false)
  const [dropAssign, setDropAssign] = useState(null) // { player, teamId }

  const availablePlayers = state.players.filter(p => p.status === 'available')

  function handlePlayerDrop(playerId, teamId) {
    const player = state.players.find(p => p.id === playerId)
    if (!player) return
    setDropAssign({ player, teamId })
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
          {state.players.length === 0 ? (
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
