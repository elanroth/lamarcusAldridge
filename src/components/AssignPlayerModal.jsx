import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useDraft } from '../context/DraftContext'
import { availableSlotsForPlayer, remainingBudget, parsePositions } from '../utils/helpers'

/** Lower score = more preferred slot for this player */
function slotPriority(slot, playerPositions) {
  if (playerPositions.includes(slot)) return 0  // exact match (2B → 2B slot)
  if (slot === 'MI' || slot === 'CI') return 1  // flex infield
  if (slot === 'UTIL') return 2                 // catch-all
  return 3
}

export default function AssignPlayerModal({ player, preselectedTeamId, onClose }) {
  const { state, dispatch } = useDraft()
  const [teamId, setTeamId] = useState(preselectedTeamId || '')
  const [price, setPrice] = useState('')
  const [rosterSlot, setRosterSlot] = useState('')
  const priceRef = useRef(null)

  useEffect(() => { priceRef.current?.focus() }, [])

  const selectedTeam = state.teams.find(t => t.id === teamId)

  const teamPlayers = useMemo(() =>
    teamId ? state.players.filter(p => p.teamId === teamId) : [],
    [state.players, teamId]
  )

  const slotOptions = useMemo(() =>
    teamId ? availableSlotsForPlayer(player.position, teamPlayers) : [],
    [player.position, teamPlayers, teamId]
  )

  const playerPositions = useMemo(() => parsePositions(player.position), [player.position])

  // Smart default: pick best slot whenever options change
  useEffect(() => {
    if (slotOptions.length === 0) { setRosterSlot(''); return }
    const best = [...slotOptions].sort((a, b) =>
      slotPriority(a.slot, playerPositions) - slotPriority(b.slot, playerPositions)
    )[0]
    setRosterSlot(best.slot)
  }, [slotOptions, playerPositions])

  const budget = selectedTeam ? remainingBudget(selectedTeam, state.players) : null
  const priceNum = parseFloat(price)
  const overBudget = budget != null && !isNaN(priceNum) && priceNum > budget
  const canSubmit = !!(teamId && rosterSlot && price !== '' && !overBudget)

  function doSubmit() {
    if (!canSubmit) return
    dispatch({
      type: 'ASSIGN_PLAYER',
      playerId: player.id,
      teamId,
      price: priceNum,
      rosterSlot,
      isKeeper: false,
    })
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    doSubmit()
  }

  function handlePriceKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); doSubmit() }
  }

  // Use radio pills when 2–3 options; dropdown for 4+
  const useRadio = slotOptions.length >= 2 && slotOptions.length <= 3

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Draft Player</h2>
            <p className="modal-subtitle">{player.name} · {player.position}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">

          {preselectedTeamId ? (
            <div className="form-group">
              <label>Team</label>
              <div className="preselected-team">
                {selectedTeam?.name}
                <span className="team-budget-pill">${budget} left</span>
              </div>
            </div>
          ) : (
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
          )}

          <div className="form-group">
            <label>Purchase Price ($)</label>
            <input
              ref={priceRef}
              className={`input price-input-lg ${overBudget ? 'input-error' : ''}`}
              type="number"
              min="1"
              max="260"
              value={price}
              onChange={e => setPrice(e.target.value)}
              onKeyDown={handlePriceKeyDown}
              placeholder="Enter price…"
            />
            {overBudget && <span className="field-error">Exceeds remaining budget (${budget})</span>}
            {player.dollarValue != null && (
              <span className="field-hint">Projected: ${player.dollarValue.toFixed(0)}</span>
            )}
          </div>

          <div className="form-group">
            <label>Roster Slot</label>
            {!teamId ? (
              <select className="input" disabled><option>Select a team first</option></select>
            ) : slotOptions.length === 0 ? (
              <p className="field-error">No eligible open slots on this team for {player.position}.</p>
            ) : useRadio ? (
              <div className="slot-radio-group">
                {slotOptions.map(s => (
                  <label
                    key={s.slot}
                    className={`slot-radio-option ${rosterSlot === s.slot ? 'selected' : ''}`}
                    onClick={() => setRosterSlot(s.slot)}
                  >
                    <input
                      type="radio"
                      name="rosterSlot"
                      value={s.slot}
                      checked={rosterSlot === s.slot}
                      onChange={() => setRosterSlot(s.slot)}
                    />
                    <span className="slot-radio-label">{s.label}</span>
                    <span className="slot-radio-remaining">{s.remaining} open</span>
                  </label>
                ))}
              </div>
            ) : (
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
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!canSubmit}
            >
              Confirm ↵
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
