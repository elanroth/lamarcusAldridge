import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDraft } from '../context/DraftContext'
import { remainingBudget } from '../utils/helpers'
import { TOTAL_BUDGET, TOTAL_ROSTER_SPOTS } from '../utils/constants'

export default function TeamOverview({ onPlayerDrop }) {
  const { state } = useDraft()
  const [dragOverId, setDragOverId] = useState(null)

  function handleDragOver(e, teamId) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverId(teamId)
  }

  function handleDragLeave() {
    setDragOverId(null)
  }

  function handleDrop(e, teamId) {
    e.preventDefault()
    setDragOverId(null)
    const playerId = e.dataTransfer.getData('playerId')
    if (playerId) onPlayerDrop(playerId, teamId)
  }

  if (state.teams.length === 0) {
    return (
      <div className="teams-sidebar">
        <p className="sidebar-title">Teams</p>
        <p className="empty-hint">No teams yet.</p>
      </div>
    )
  }

  return (
    <div className="teams-sidebar">
      <p className="sidebar-title">Teams — drag player to assign</p>
      <div className="team-cards">
        {state.teams.map(team => {
          const roster = state.players.filter(p => p.teamId === team.id)
          const remaining = remainingBudget(team, state.players)
          const spent = TOTAL_BUDGET - remaining
          const pct = Math.round((spent / TOTAL_BUDGET) * 100)

          return (
            <div
              key={team.id}
              className={`team-card-compact ${dragOverId === team.id ? 'drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, team.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, team.id)}
            >
              <Link to={`/team/${team.id}`} className="team-card-link" onClick={e => e.stopPropagation()}>
                <span className="team-card-name">{team.name}</span>
                <span className={`team-budget-compact ${remaining < 20 ? 'low' : ''}`}>
                  ${remaining}
                </span>
              </Link>
              <div className="team-mini-bar-bg">
                <div className="team-mini-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="team-card-sub">
                <span>{roster.length}/{TOTAL_ROSTER_SPOTS}</span>
                <span>${spent} spent</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
