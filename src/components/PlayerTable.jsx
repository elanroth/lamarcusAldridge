import React, { useState, useMemo } from 'react'
import { useDraft } from '../context/DraftContext'
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

  const positionGroups = [ALL_POS_FILTER, 'Hitters', 'Pitchers', 'C', '1B', '2B', '3B', 'SS', 'OF', 'SP', 'RP']

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
                  {h} <SortIcon col={h} />
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
                <td colSpan={3 + (statHeaders.length || 2) + 1} className="empty-row">
                  No players match your filters.
                </td>
              </tr>
            ) : (
              filtered.map(player => (
                <tr
                  key={player.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('playerId', player.id)
                    e.dataTransfer.effectAllowed = 'copy'
                    // Custom drag ghost: small pill with player name
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
                  className="draggable-row"
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
                      className="btn btn-sm btn-primary"
                      onClick={() => setDraftingPlayer(player)}
                    >
                      Draft
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {draftingPlayer && (
        <AssignPlayerModal
          player={draftingPlayer}
          onClose={() => setDraftingPlayer(null)}
        />
      )}
    </div>
  )
}
