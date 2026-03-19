import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDraft } from '../context/DraftContext'
import { remainingBudget } from '../utils/helpers'
import { TOTAL_BUDGET, TOTAL_ROSTER_SPOTS } from '../utils/constants'

export default function TeamOverview({ onPlayerDrop }) {
  const { state, dispatch } = useDraft()
  const [dragOverId, setDragOverId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editingId) inputRef.current?.focus()
  }, [editingId])

  function startEdit(team, e) {
    e.preventDefault()
    e.stopPropagation()
    setEditingId(team.id)
    setEditValue(team.name)
  }

  function commitEdit(teamId) {
    if (editValue.trim()) {
      dispatch({ type: 'RENAME_TEAM', teamId, name: editValue.trim() })
    }
    setEditingId(null)
  }

  function handleKeyDown(e, teamId) {
    if (e.key === 'Enter') commitEdit(teamId)
    if (e.key === 'Escape') setEditingId(null)
  }

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
          const roster = state.players.filter(p => p.teamId === team.id && p.status !== 'rookie_keeper')
          const remaining = remainingBudget(team, state.players)
          const budget = team.budget ?? TOTAL_BUDGET
          const spent = budget - remaining
          const pct = Math.min(100, Math.max(0, Math.round(((spent || 0) / budget) * 100)))
          const openSpots = TOTAL_ROSTER_SPOTS - roster.length
          const dollarPerSpot = openSpots > 0 ? remaining / openSpots : Infinity
          const barHealth = dollarPerSpot >= 10 ? 'bar-healthy' : dollarPerSpot >= 5 ? 'bar-warn' : 'bar-danger'

          return (
            <div
              key={team.id}
              className={`team-card-compact ${dragOverId === team.id ? 'drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, team.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, team.id)}
            >
              <div className="team-card-link">
                {editingId === team.id ? (
                  <input
                    ref={inputRef}
                    className="team-name-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(team.id)}
                    onKeyDown={e => handleKeyDown(e, team.id)}
                  />
                ) : (
                  <Link
                    to={`/team/${team.id}`}
                    className="team-card-name"
                    onDoubleClick={e => startEdit(team, e)}
                    title="Double-click to rename"
                  >
                    {team.name}
                  </Link>
                )}
                <span className={`team-budget-compact ${remaining < 20 ? 'low' : ''}`}>
                  ${remaining}
                </span>
              </div>
              <div className="team-mini-bar-bg">
                <div className={`team-mini-bar-fill ${barHealth}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="team-card-sub">
                <span>{roster.length}/{TOTAL_ROSTER_SPOTS}</span>
                <span className={`dps ${dollarPerSpot < 5 ? 'dps-danger' : dollarPerSpot < 10 ? 'dps-warn' : ''}`}>
                  {openSpots > 0 ? `$${Math.round(dollarPerSpot)}/spot` : 'full'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
