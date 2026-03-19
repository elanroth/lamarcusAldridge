import React, { useState, useMemo } from 'react'
import { useDraft } from '../context/DraftContext'
import { availableSlotsForPlayer, remainingBudget } from '../utils/helpers'
import AssignPlayerModal from './AssignPlayerModal'

const ALL_POS_FILTER = 'All'
const HITTER_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH']
const PITCHER_POSITIONS = ['SP', 'RP', 'P']

export default function PlayerTable({ players }) {
  const { state } = useDraft()
  const statHeaders = state.statHeaders || []

  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState(ALL_POS_FILTER)
  const [sortKey, setSortKey] = useState('dollarValue')
  const [sortDir, setSortDir] = useState('desc')
  const [draftingPlayer, setDraftingPlayer] = useState(null)
  const [biddingPlayerId, setBiddingPlayerId] = useState(null)

  const positionGroups = [ALL_POS_FILTER, 'Hitters', 'Pitchers', 'C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP']

  const isHitterFilter = posFilter === 'Hitters' || HITTER_POSITIONS.includes(posFilter)
  const isPitcherFilter = posFilter === 'Pitchers' || PITCHER_POSITIONS.includes(posFilter)

  function getDisplayLabel(header) {
    const parts = header.split('/')
    if (parts.length >= 2) {
      if (isHitterFilter) return parts[0].trim()
      if (isPitcherFilter) return parts[1].trim()
    }
    return header
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    return players
      .filter(p => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
        if (posFilter === ALL_POS_FILTER) return true
        if (posFilter === 'Hitters') return HITTER_POSITIONS.some(hp => p.position.toUpperCase().includes(hp))
        if (posFilter === 'Pitchers') return PITCHER_POSITIONS.some(pp => p.position.toUpperCase().includes(pp))
        return p.position.toUpperCase().includes(posFilter)
      })
      .sort((a, b) => {
        let aVal, bVal
        if (statHeaders.includes(sortKey)) {
          aVal = a.statCols?.[sortKey]
          bVal = b.statCols?.[sortKey]
        } else {
          aVal = a[sortKey]
          bVal = b[sortKey]
        }
        if (aVal == null) aVal = sortDir === 'asc' ? Infinity : -Infinity
        if (bVal == null) bVal = sortDir === 'asc' ? Infinity : -Infinity
        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
        return 0
      })
  }, [players, search, posFilter, sortKey, sortDir, statHeaders])

  function SortIcon({ col }) {
    if (sortKey !== col) return <span className="sort-icon">↕</span>
    return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  function fmtStat(val) {
    if (val == null) return '—'
    return parseFloat(val).toFixed(2)
  }

  function handleDraftClick(player) {
    if (biddingPlayerId === player.id) {
      setBiddingPlayerId(null)
    } else {
      setBiddingPlayerId(player.id)
    }
  }

  const colCount = 2 + (statHeaders.length || 2) + 1

  return (
    <div className="player-table-wrapper">
      <div className="table-controls">
        <input
          className="input search-input"
          placeholder="Search players…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="pos-filters">
          {positionGroups.map(p => (
            <button
              key={p}
              className={`pos-filter-btn ${posFilter === p ? 'active' : ''}`}
              onClick={() => setPosFilter(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="table-count">
        {filtered.length} of {players.length} available players
      </div>

      <div className="table-scroll">
        <table className="player-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('name')} className="sortable">
                Player <SortIcon col="name" />
              </th>
              <th onClick={() => toggleSort('position')} className="sortable">
                Pos <SortIcon col="position" />
              </th>
              {statHeaders.map(h => (
                <th key={h} onClick={() => toggleSort(h)} className="sortable">
                  {getDisplayLabel(h)} <SortIcon col={h} />
                </th>
              ))}
              {statHeaders.length === 0 && (
                <>
                  <th onClick={() => toggleSort('projectedValue')} className="sortable">
                    Proj <SortIcon col="projectedValue" />
                  </th>
                  <th onClick={() => toggleSort('dollarValue')} className="sortable">
                    $ Val <SortIcon col="dollarValue" />
                  </th>
                </>
              )}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="empty-row">
                  No players match your filters.
                </td>
              </tr>
            ) : (
              filtered.map(player => {
                const isBidding = biddingPlayerId === player.id
                return (
                  <React.Fragment key={player.id}>
                    <tr
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('playerId', player.id)
                        e.dataTransfer.effectAllowed = 'copy'
                        const ghost = document.createElement('div')
                        ghost.textContent = player.name
                        ghost.style.cssText = [
                          'position:fixed', 'top:-200px', 'left:0',
                          'background:#388bfd', 'color:#fff',
                          'padding:5px 14px', 'border-radius:20px',
                          'font:600 13px/1.4 system-ui,sans-serif',
                          'white-space:nowrap', 'pointer-events:none',
                          'box-shadow:0 4px 12px rgba(0,0,0,0.4)',
                        ].join(';')
                        document.body.appendChild(ghost)
                        e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 16)
                        setTimeout(() => document.body.removeChild(ghost), 0)
                      }}
                      className={`draggable-row ${isBidding ? 'bidding-active' : ''}`}
                    >
                      <td className="player-name">{player.name}</td>
                      <td><span className="pos-badge">{player.position}</span></td>
                      {statHeaders.length > 0
                        ? statHeaders.map(h => (
                            <td key={h} className="num-cell">
                              {fmtStat(player.statCols?.[h])}
                            </td>
                          ))
                        : (
                          <>
                            <td className="num-cell">
                              {player.projectedValue != null ? player.projectedValue.toFixed(1) : '—'}
                            </td>
                            <td className="num-cell dollar-val">
                              {player.dollarValue != null ? `$${player.dollarValue.toFixed(0)}` : '—'}
                            </td>
                          </>
                        )
                      }
                      <td>
                        <button
                          className={`btn btn-sm ${isBidding ? 'btn-ghost' : 'btn-primary'}`}
                          onClick={() => handleDraftClick(player)}
                        >
                          {isBidding ? 'Cancel' : 'Draft'}
                        </button>
                      </td>
                    </tr>
                    {isBidding && (
                      <BiddingExpansionRow
                        player={player}
                        colCount={colCount}
                        allTeams={state.teams}
                        allPlayers={state.players}
                        onSelectTeam={teamId => {
                          setBiddingPlayerId(null)
                          setDraftingPlayer({ ...player, _preselectedTeamId: teamId })
                        }}
                      />
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {draftingPlayer && (
        <AssignPlayerModal
          player={draftingPlayer}
          preselectedTeamId={draftingPlayer._preselectedTeamId || null}
          onClose={() => setDraftingPlayer(null)}
        />
      )}
    </div>
  )
}

function BiddingExpansionRow({ player, colCount, allTeams, allPlayers, onSelectTeam }) {
  const teamRows = allTeams.map(team => {
    const teamPlayers = allPlayers.filter(p => p.teamId === team.id)
    const budget = remainingBudget(team, allPlayers)
    const openSlots = availableSlotsForPlayer(player.position, teamPlayers)
    return { team, budget, openSlots }
  })

  // Sort: teams with open slots first, then by budget desc
  const sorted = [...teamRows].sort((a, b) => {
    if (a.openSlots.length > 0 && b.openSlots.length === 0) return -1
    if (a.openSlots.length === 0 && b.openSlots.length > 0) return 1
    return b.budget - a.budget
  })

  return (
    <tr className="bidding-expansion-row">
      <td colSpan={colCount} className="bidding-expansion-cell">
        <div className="bidding-expansion-header">
          <strong>{player.name}</strong> — select a team to draft:
        </div>
        <div className="bidding-teams-grid">
          {sorted.map(({ team, budget, openSlots }) => {
            const hasSlot = openSlots.length > 0
            return (
              <div
                key={team.id}
                className={`bidding-team-card ${hasSlot ? 'has-slot' : 'no-slot'}`}
                onClick={hasSlot ? () => onSelectTeam(team.id) : undefined}
                title={hasSlot ? `Draft to ${team.name}` : 'No eligible open slot'}
              >
                <div className="bidding-team-name">{team.name}</div>
                <div className="bidding-team-budget">${budget} left</div>
                <div className="bidding-team-slots">
                  {hasSlot
                    ? openSlots.map(s => (
                        <span key={s.slot} className="bidding-slot-tag">✓ {s.slot}</span>
                      ))
                    : <span className="bidding-no-slot">✗ no slot</span>
                  }
                </div>
              </div>
            )
          })}
        </div>
      </td>
    </tr>
  )
}
