import React, { useState, useMemo } from 'react'
import { useDraft } from '../context/DraftContext'
import { remainingBudget } from '../utils/helpers'
import { TOTAL_BUDGET } from '../utils/constants'

const RATE_STAT_KEYWORDS = ['AVG', 'ERA', 'WHIP', 'OBP', 'SLG', 'OPS']

function isRateStat(label) {
  return RATE_STAT_KEYWORDS.some(k => label.toUpperCase().includes(k))
}

function getHitterLabel(header) {
  const parts = header.split('/')
  return parts[0].trim()
}

function getPitcherLabel(header) {
  const parts = header.split('/')
  return parts.length >= 2 ? parts[1].trim() : parts[0].trim()
}

function aggregateStat(players, header, isRate) {
  const vals = players.map(p => p.statCols?.[header]).filter(v => v != null && !isNaN(v))
  if (vals.length === 0) return null
  const sum = vals.reduce((a, b) => a + b, 0)
  return isRate ? sum / vals.length : sum
}

export default function StandingsPanel() {
  const { state } = useDraft()
  const { teams, players, statHeaders } = state

  const [hitterSort, setHitterSort] = useState('totalValue')
  const [hitterDir, setHitterDir] = useState('desc')
  const [pitcherSort, setPitcherSort] = useState('totalValue')
  const [pitcherDir, setPitcherDir] = useState('desc')

  const HITTER_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH']
  const PITCHER_POSITIONS = ['SP', 'RP', 'P']

  // Determine which headers are "shared" (no slash) vs dual-use
  const hitterHeaders = statHeaders.filter(h => {
    const label = getHitterLabel(h)
    return label.length > 0
  })
  const pitcherHeaders = statHeaders.filter(h => {
    const label = getPitcherLabel(h)
    return label.length > 0
  })

  const hitterRows = useMemo(() => {
    return teams.map(team => {
      const teamPlayers = players.filter(
        p => p.teamId === team.id && p.status !== 'rookie_keeper' &&
          HITTER_POSITIONS.some(pos => p.position.toUpperCase().includes(pos))
      )
      const totalValue = teamPlayers.reduce((sum, p) => sum + (p.dollarValue ?? 0), 0)
      const stats = {}
      for (const h of hitterHeaders) {
        const label = getHitterLabel(h)
        stats[h] = aggregateStat(teamPlayers, h, isRateStat(label))
      }
      const budget = remainingBudget(team, players)
      return { team, stats, totalValue, budget, count: teamPlayers.length }
    })
  }, [teams, players, statHeaders])

  const pitcherRows = useMemo(() => {
    return teams.map(team => {
      const teamPlayers = players.filter(
        p => p.teamId === team.id && p.status !== 'rookie_keeper' &&
          PITCHER_POSITIONS.some(pos => p.position.toUpperCase().includes(pos))
      )
      const totalValue = teamPlayers.reduce((sum, p) => sum + (p.dollarValue ?? 0), 0)
      const stats = {}
      for (const h of pitcherHeaders) {
        const label = getPitcherLabel(h)
        stats[h] = aggregateStat(teamPlayers, h, isRateStat(label))
      }
      const budget = remainingBudget(team, players)
      return { team, stats, totalValue, budget, count: teamPlayers.length }
    })
  }, [teams, players, statHeaders])

  function sortRows(rows, sortKey, dir) {
    return [...rows].sort((a, b) => {
      let aVal = sortKey === 'totalValue' || sortKey === 'budget' ? a[sortKey] : (a.stats[sortKey] ?? null)
      let bVal = sortKey === 'totalValue' || sortKey === 'budget' ? b[sortKey] : (b.stats[sortKey] ?? null)
      if (aVal == null) aVal = dir === 'asc' ? Infinity : -Infinity
      if (bVal == null) bVal = dir === 'asc' ? Infinity : -Infinity
      if (aVal < bVal) return dir === 'asc' ? -1 : 1
      if (aVal > bVal) return dir === 'asc' ? 1 : -1
      return 0
    })
  }

  function fmtStat(val, label) {
    if (val == null) return '—'
    if (isRateStat(label)) return parseFloat(val).toFixed(3).replace(/^0\./, '.')
    return parseFloat(val).toFixed(0)
  }

  function SortIcon({ col, currentSort, dir }) {
    if (currentSort !== col) return <span className="sort-icon">↕</span>
    return <span className="sort-icon active">{dir === 'asc' ? '↑' : '↓'}</span>
  }

  function toggleHitterSort(key) {
    if (hitterSort === key) setHitterDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setHitterSort(key); setHitterDir(isRateStat(getHitterLabel(key)) ? 'asc' : 'desc') }
  }

  function togglePitcherSort(key) {
    if (pitcherSort === key) setPitcherDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setPitcherSort(key); setPitcherDir(isRateStat(getPitcherLabel(key)) ? 'asc' : 'desc') }
  }

  if (teams.length === 0) {
    return (
      <div className="standings-empty">
        <p>No teams yet. Add teams and draft players to see projected standings.</p>
      </div>
    )
  }

  const sortedHitters = sortRows(hitterRows, hitterSort, hitterDir)
  const sortedPitchers = sortRows(pitcherRows, pitcherSort, pitcherDir)

  return (
    <div className="standings-panel">
      <h2 className="standings-title">Projected Standings</h2>

      {/* Hitter Stats Table */}
      <section className="standings-section">
        <h3 className="standings-subtitle">Hitter Stats</h3>
        <div className="table-scroll">
          <table className="player-table standings-table">
            <thead>
              <tr>
                <th className="standings-rank">#</th>
                <th>Team</th>
                <th
                  className="sortable"
                  onClick={() => { setHitterSort('totalValue'); setHitterDir(d => hitterSort === 'totalValue' ? (d === 'asc' ? 'desc' : 'asc') : 'desc') }}
                >
                  Proj $ <SortIcon col="totalValue" currentSort={hitterSort} dir={hitterDir} />
                </th>
                {hitterHeaders.map(h => {
                  const label = getHitterLabel(h)
                  return (
                    <th key={h} className="sortable" onClick={() => toggleHitterSort(h)}>
                      {label} <SortIcon col={h} currentSort={hitterSort} dir={hitterDir} />
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sortedHitters.map((row, i) => (
                <tr key={row.team.id} className={i === 0 ? 'standings-leader' : ''}>
                  <td className="standings-rank">{i + 1}</td>
                  <td className="player-name">{row.team.name}</td>
                  <td className="num-cell dollar-val">
                    {row.count > 0 ? `$${row.totalValue.toFixed(0)}` : '—'}
                  </td>
                  {hitterHeaders.map(h => (
                    <td key={h} className="num-cell">
                      {fmtStat(row.stats[h], getHitterLabel(h))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pitcher Stats Table */}
      <section className="standings-section">
        <h3 className="standings-subtitle">Pitcher Stats</h3>
        <div className="table-scroll">
          <table className="player-table standings-table">
            <thead>
              <tr>
                <th className="standings-rank">#</th>
                <th>Team</th>
                <th
                  className="sortable"
                  onClick={() => { setPitcherSort('totalValue'); setPitcherDir(d => pitcherSort === 'totalValue' ? (d === 'asc' ? 'desc' : 'asc') : 'desc') }}
                >
                  Proj $ <SortIcon col="totalValue" currentSort={pitcherSort} dir={pitcherDir} />
                </th>
                {pitcherHeaders.map(h => {
                  const label = getPitcherLabel(h)
                  return (
                    <th key={h} className="sortable" onClick={() => togglePitcherSort(h)}>
                      {label} <SortIcon col={h} currentSort={pitcherSort} dir={pitcherDir} />
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sortedPitchers.map((row, i) => (
                <tr key={row.team.id} className={i === 0 ? 'standings-leader' : ''}>
                  <td className="standings-rank">{i + 1}</td>
                  <td className="player-name">{row.team.name}</td>
                  <td className="num-cell dollar-val">
                    {row.count > 0 ? `$${row.totalValue.toFixed(0)}` : '—'}
                  </td>
                  {pitcherHeaders.map(h => (
                    <td key={h} className="num-cell">
                      {fmtStat(row.stats[h], getPitcherLabel(h))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="standings-note">
        Counting stats are summed · Rate stats (AVG, ERA, WHIP) are averaged across rostered players
      </p>
    </div>
  )
}
