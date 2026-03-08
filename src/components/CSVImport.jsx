import React, { useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useDraft } from '../context/DraftContext'

export default function CSVImport() {
  const { dispatch } = useDraft()
  const inputRef = useRef(null)

  function importRows(rows) {
    if (rows.length === 0) { alert('No data found in file.'); return }
    const confirmed = window.confirm(
      `Import ${rows.length} players? This will replace the current player list.`
    )
    if (!confirmed) return
    dispatch({ type: 'IMPORT_PLAYERS', rows })
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const workbook = XLSX.read(evt.target.result, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        importRows(rows)
      }
      reader.readAsArrayBuffer(file)
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => importRows(results.data),
        error: (err) => alert('Error parsing file: ' + err.message),
      })
    }

    e.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button className="btn btn-secondary" onClick={() => inputRef.current.click()}>
        Import CSV / Excel
      </button>
    </>
  )
}
