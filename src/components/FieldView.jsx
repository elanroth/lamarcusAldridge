import React from 'react'

// Coordinates are CSS % of the container (aspect-ratio 5/4)
// SVG viewBox is 0 0 100 80 — same ratio, so x%=SVG_x, y%=SVG_y/80*100
const FIELD_SPOTS = [
  { slot: 'OF',   idx: 0, label: 'LF',   x: 7,  y: 25 },
  { slot: 'OF',   idx: 1, label: 'LCF',  x: 26, y: 14 },
  { slot: 'OF',   idx: 2, label: 'CF',   x: 50, y: 7  },
  { slot: 'OF',   idx: 3, label: 'RCF',  x: 74, y: 14 },
  { slot: 'OF',   idx: 4, label: 'RF',   x: 93, y: 25 },
  { slot: '3B',   idx: 0, label: '3B',   x: 22, y: 70 },
  { slot: 'SS',   idx: 0, label: 'SS',   x: 37, y: 59 },
  { slot: '2B',   idx: 0, label: '2B',   x: 63, y: 57 },
  { slot: '1B',   idx: 0, label: '1B',   x: 78, y: 70 },
  { slot: 'C',    idx: 0, label: 'C',    x: 40, y: 88 },
  { slot: 'C',    idx: 1, label: 'C',    x: 60, y: 88 },
]

const FLEX_SPOTS = [
  { slot: 'MI',   idx: 0, label: 'MI'   },
  { slot: 'CI',   idx: 0, label: 'CI'   },
  { slot: 'UTIL', idx: 0, label: 'UTIL' },
]

export default function FieldView({ rosterPlayers, onUnassign }) {
  const bySlot = {}
  for (const p of rosterPlayers) {
    if (!bySlot[p.rosterSlot]) bySlot[p.rosterSlot] = []
    bySlot[p.rosterSlot].push(p)
  }
  const pitchers = bySlot['P'] || []

  return (
    <div className="field-view">
      <div className="baseball-field">

        {/* SVG field background — proper pie/sector shape */}
        <svg className="field-svg-bg" viewBox="0 0 100 80" preserveAspectRatio="none">
          {/* Warning track outer */}
          <path d="M 50,77 L 1,3 A 82,82 0 0 1 99,3 Z" fill="#5c3f1e"/>
          {/* Grass */}
          <path d="M 50,77 L 4,6 A 78,78 0 0 1 96,6 Z" fill="#1e5225"/>
          {/* Infield dirt: home(50,77) 1B(66,61) 2B(50,45) 3B(34,61) */}
          <polygon points="50,77 66,61 50,45 34,61" fill="#6b4c2a"/>
          {/* Pitcher's mound */}
          <circle cx="50" cy="62" r="2.5" fill="#7d5c34"/>
          {/* Bases */}
          <rect x="64" y="59" width="4" height="4" fill="#ece8e0" rx="0.5" transform="rotate(45,66,61)"/>
          <rect x="48" y="43" width="4" height="4" fill="#ece8e0" rx="0.5" transform="rotate(45,50,45)"/>
          <rect x="32" y="59" width="4" height="4" fill="#ece8e0" rx="0.5" transform="rotate(45,34,61)"/>
          {/* Home plate */}
          <polygon points="50,77.5 52.5,75 52.5,73 50,72 47.5,73 47.5,75" fill="#ece8e0"/>
          {/* Baselines */}
          <line x1="50" y1="77" x2="66" y2="61" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4"/>
          <line x1="66" y1="61" x2="50" y2="45" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4"/>
          <line x1="50" y1="45" x2="34" y2="61" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4"/>
          <line x1="34" y1="61" x2="50" y2="77" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4"/>
          {/* Foul lines */}
          <line x1="50" y1="77" x2="1" y2="3" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
          <line x1="50" y1="77" x2="99" y2="3" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
        </svg>

        {/* Position player cards */}
        {FIELD_SPOTS.map((spot, i) => {
          const player = (bySlot[spot.slot] || [])[spot.idx] ?? null
          return (
            <div key={i} className="field-spot" style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
              <FieldCard spot={spot} player={player} onUnassign={onUnassign} />
            </div>
          )
        })}

        {/* Pitcher cluster at the mound */}
        <div className="field-pitchers-cluster">
          {Array.from({ length: 9 }, (_, i) => {
            const player = pitchers[i] ?? null
            return (
              <div
                key={i}
                className={`field-pitcher-card${player ? ' filled' : ' empty'}${player?.status === 'keeper' ? ' keeper' : ''}`}
              >
                {player ? (
                  <>
                    <div className="field-pitcher-name">{player.name}</div>
                    <div className="field-pitcher-meta">
                      <span className="pos-badge">{player.position}</span>
                      <span className="field-card-price">${player.purchasedPrice}</span>
                      {player.status === 'keeper' && <span className="keeper-tag">K</span>}
                    </div>
                    {onUnassign && (
                      <button className="field-card-remove" onClick={() => onUnassign(player.id)}>×</button>
                    )}
                  </>
                ) : (
                  <div className="field-card-empty">P</div>
                )}
              </div>
            )
          })}
        </div>

      </div>

      {/* Flex slots below the field */}
      <div className="field-flex-bar">
        {FLEX_SPOTS.map((spot, i) => {
          const player = (bySlot[spot.slot] || [])[spot.idx] ?? null
          return (
            <div key={i} className="field-flex-slot">
              <FieldCard spot={spot} player={player} onUnassign={onUnassign} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FieldCard({ spot, player, onUnassign }) {
  const cls = ['field-card', player ? 'filled' : 'empty', player?.status === 'keeper' ? 'keeper' : ''].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      <div className="field-card-slot">{spot.label}</div>
      {player ? (
        <>
          <div className="field-card-name">{player.name}</div>
          <div className="field-card-footer">
            <span className="field-card-price">${player.purchasedPrice}</span>
            {player.status === 'keeper' && <span className="keeper-tag">K</span>}
          </div>
          {onUnassign && (
            <button className="field-card-remove" onClick={() => onUnassign(player.id)}>×</button>
          )}
        </>
      ) : (
        <div className="field-card-empty">—</div>
      )}
    </div>
  )
}
