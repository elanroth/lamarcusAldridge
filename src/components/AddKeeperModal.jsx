import React, { useState, useMemo } from 'react'
import { useDraft } from '../context/DraftContext'
import { availableSlotsForPlayer, remainingBudget, uid } from '../utils/helpers'

export default function AddKeeperModal({ onClose }) {
  const { state, dispatch } = useDraft()
  const [search, setSearch] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customPos, setCustomPos] = useState('')
  const [teamId, setTeamId] = useState('')
  const [price, setPrice] = useState('')
  const [rosterSlot, setRosterSlot] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [isRookieKeeper, setIsRookieKeeper] = useState(false)

  const availablePlayers = state.players.filter(p => p.status === 'available')

  const filtered = useMemo(() =>
    search.length > 0
      ? availablePlayers.filter(p =>
          p.name.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 8)
      : [],
    [search, availablePlayers]
  )

  const selectedPlayer = useCustom
    ? (customName && customPos ? { id: '__custom__', name: customName, position: customPos } : null)
    : state.players.find(p => p.id === selectedPlayerId) || null

  const selectedTeam = state.teams.find(t => t.id === teamId)

  const teamPlayers = useMemo(() =>
    teamId ? state.players.filter(p => p.teamId === teamId) : [],
    [state.players, teamId]
  )

  const slotOptions = useMemo(() =>
    selectedPlayer && teamId && !isRookieKeeper
      ? availableSlotsForPlayer(selectedPlayer.position, teamPlayers)
      : [],
    [selectedPlayer, teamPlayers, teamId, isRookieKeeper]
  )

  const budget = selectedTeam ? remainingBudget(selectedTeam, state.players) : null
  const priceNum = parseFloat(price)
  const overBudget = budget != null && !isNaN(priceNum) && priceNum > budget

  const canSubmit = selectedPlayer && teamId && price !== '' && !isNaN(priceNum) && !overBudget &&
    (isRookieKeeper || rosterSlot !== '')

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    if (useCustom && selectedPlayer.id === '__custom__') {
      dispatch({
        type: 'ADD_AND_ASSIGN_KEEPER',
        player: { name: customName, position: customPos.toUpperCase() },
        teamId,
        price: priceNum,
        rosterSlot: isRookieKeeper ? null : rosterSlot,
        isRookieKeeper,
      })
    } else {
      dispatch({
        type: 'ASSIGN_PLAYER',
        playerId: selectedPlayer.id,
        teamId,
        price: priceNum,
        rosterSlot: isRookieKeeper ? null : rosterSlot,
        isKeeper: !isRookieKeeper,
        isRookieKeeper,
      })
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Keeper</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">

          {/* Keeper type toggle */}
          <div className="tab-toggle">
            <button
              type="button"
              className={`tab-btn ${!isRookieKeeper ? 'active' : ''}`}
              onClick={() => { setIsRookieKeeper(false); setRosterSlot('') }}
            >
              Keeper
            </button>
            <button
              type="button"
              className={`tab-btn ${isRookieKeeper ? 'active' : ''}`}
              onClick={() => { setIsRookieKeeper(true); setRosterSlot('') }}
            >
              Rookie Keeper
            </button>
          </div>

          {/* Player source toggle */}
          <div className="tab-toggle" style={{ marginTop: 6 }}>
            <button
              type="button"
              className={`tab-btn ${!useCustom ? 'active' : ''}`}
              onClick={() => { setUseCustom(false); setSelectedPlayerId(''); setRosterSlot('') }}
            >
              From Player List
            </button>
            <button
              type="button"
              className={`tab-btn ${useCustom ? 'active' : ''}`}
              onClick={() => { setUseCustom(true); setSelectedPlayerId(''); setRosterSlot('') }}
            >
              Add New Player
            </button>
          </div>

          {!useCustom ? (
            <div className="form-group">
              <label>Search Player</label>
              <input
                className="input"
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedPlayerId(''); setRosterSlot('') }}
                placeholder="Type player name…"
                autoFocus
              />
              {filtered.length > 0 && !selectedPlayerId && (
                <div className="autocomplete-list">
                  {filtered.map(p => (
                    <div
                      key={p.id}
                      className="autocomplete-item"
                      onClick={() => { setSelectedPlayerId(p.id); setSearch(p.name); setRosterSlot('') }}
                    >
                      <span>{p.name}</span>
                      <span className="pos-badge">{p.position}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedPlayerId && (
                <p className="selected-player-info">
                  Selected: <strong>{state.players.find(p => p.id === selectedPlayerId)?.name}</strong>
                  {' '}·{' '}
                  {state.players.find(p => p.id === selectedPlayerId)?.position}
                  <button type="button" className="btn-link" onClick={() => { setSelectedPlayerId(''); setSearch(''); setRosterSlot('') }}>
                    Clear
                  </button>
                </p>
              )}
            </div>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label>Player Name</label>
                <input
                  className="input"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Position</label>
                <input
                  className="input"
                  value={customPos}
                  onChange={e => setCustomPos(e.target.value)}
                  placeholder="e.g. OF, SP, 2B/SS"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Assign to Team</label>
            <select
              className="input"
              value={teamId}
              onChange={e => { setTeamId(e.target.value); setRosterSlot('') }}
            >
              <option value="">— Select team —</option>
              {state.teams.map(t => {
                const rem = remainingBudget(t, state.players)
                return (
                  <option key={t.id} value={t.id}>
                    {t.name}  (${rem} remaining)
                  </option>
                )
              })}
            </select>
          </div>

          <div className="form-group">
            <label>Keeper Price ($)</label>
            <input
              className={`input ${overBudget ? 'input-error' : ''}`}
              type="number"
              min="0"
              max="260"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="e.g. 10"
            />
            {overBudget && (
              <span className="field-error">Exceeds remaining budget (${budget})</span>
            )}
          </div>

          {!isRookieKeeper && (
            <div className="form-group">
              <label>Roster Slot</label>
              {selectedPlayer && teamId ? (
                slotOptions.length > 0 ? (
                  <select
                    className="input"
                    value={rosterSlot}
                    onChange={e => setRosterSlot(e.target.value)}
                  >
                    <option value="">— Select slot —</option>
                    {slotOptions.map(s => (
                      <option key={s.slot} value={s.slot}>
                        {s.label} ({s.remaining} open)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="field-error">No eligible open slots on this team.</p>
                )
              ) : (
                <select className="input" disabled>
                  <option>Select player and team first</option>
                </select>
              )}
            </div>
          )}

          {isRookieKeeper && (
            <p className="field-hint" style={{ marginTop: 2 }}>
              Rookie keepers don't occupy a roster slot and are tracked separately.
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn btn-accent"
              disabled={!canSubmit}
            >
              Add {isRookieKeeper ? 'Rookie Keeper' : 'Keeper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
