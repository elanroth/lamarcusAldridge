import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { DraftProvider, useDraft } from './context/DraftContext'
import Dashboard from './pages/Dashboard'
import TeamPage from './pages/TeamPage'

// Column indices to extract (0-based): F=5, G=6, H=7, I=8, J=9, N=13
const STAT_INDICES = [5, 6, 7, 8, 9, 13]

function AutoLoader() {
  const { dispatch } = useDraft()

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/Meltzer Baseball Values.xlsx')
      .then(r => r.arrayBuffer())
      .then(buffer => {
        const wb = XLSX.read(buffer, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
        if (rows.length < 2) return

        const headers = rows[0]
        const statHeaders = STAT_INDICES.map(i => String(headers[i] ?? `Col${i}`))

        const players = rows.slice(1)
          .filter(row => row[0])
          .map(row => {
            const statCols = {}
            STAT_INDICES.forEach((colIdx, si) => {
              const raw = row[colIdx]
              statCols[statHeaders[si]] = raw !== '' && raw != null ? parseFloat(raw) : null
            })
            // Col N (index 13) = Adjusted — use as the dollar value
            const adjVal = row[13]
            return {
              name: String(row[0]).trim(),
              position: String(row[2] ?? '').trim().toUpperCase(),
              statCols,
              dollarValue: adjVal !== '' && adjVal != null ? parseFloat(adjVal) : null,
            }
          })

        dispatch({ type: 'AUTO_LOAD_PLAYERS', players, statHeaders })
      })
      .catch(err => console.error('Auto-load failed:', err))
  }, [dispatch])

  return null
}

export default function App() {
  return (
    <DraftProvider>
      <AutoLoader />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/team/:teamId" element={<TeamPage />} />
      </Routes>
    </DraftProvider>
  )
}
