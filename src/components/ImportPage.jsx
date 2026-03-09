import { useState, useRef, useCallback } from 'react'
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react'
import { parseFireflyCSV, mergeTransactions } from '../lib/csvParser.js'

export default function ImportPage({ transactions, onImport }) {
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success'|'error', msg }
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  const processFile = useCallback((file) => {
    if (!file?.name.endsWith('.csv')) {
      setStatus({ type: 'error', msg: 'Please select a CSV file.' })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = parseFireflyCSV(e.target.result)
        const merged = mergeTransactions(transactions, parsed)
        const newCount = merged.length - transactions.length
        setPreview({ parsed, merged, newCount, fileName: file.name })
        setStatus(null)
      } catch (err) {
        setStatus({ type: 'error', msg: `Parse error: ${err.message}` })
      }
    }
    reader.readAsText(file)
  }, [transactions])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }, [processFile])

  const onFileChange = (e) => processFile(e.target.files[0])

  const confirmImport = () => {
    if (!preview) return
    onImport(preview.merged)
    setStatus({ type: 'success', msg: `Imported ${preview.newCount} new transactions (${preview.parsed.length - preview.newCount} duplicates skipped).` })
    setPreview(null)
  }

  const transfers = preview?.parsed.filter(t => t.isTransfer).length ?? 0
  const income = preview?.parsed.filter(t => t.isIncome).length ?? 0
  const expense = preview?.parsed.filter(t => t.isExpense).length ?? 0

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold mb-1">Import Transactions</h2>
      <p className="text-sm text-white/40 mb-6">Supports Firefly III CSV export format. Duplicates are detected by <code className="text-accent text-xs">import_hash_v2</code>.</p>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
          dragging ? 'border-accent bg-accent/10' : 'border-white/[0.1] hover:border-white/20 hover:bg-white/[0.02]'
        }`}
      >
        <Upload size={32} className="mx-auto mb-3 text-white/30" />
        <p className="font-medium text-sm">Drop your Firefly III CSV here</p>
        <p className="text-xs text-white/35 mt-1">or click to browse</p>
        <input ref={fileRef} type="file" accept=".csv" onChange={onFileChange} className="hidden" />
      </div>

      {/* Status */}
      {status && (
        <div className={`mt-4 flex items-start gap-3 p-4 rounded-xl border ${
          status.type === 'success' ? 'border-[#2dd4a0]/30 bg-[#2dd4a0]/10 text-[#2dd4a0]' : 'border-[#f06080]/30 bg-[#f06080]/10 text-[#f06080]'
        }`}>
          {status.type === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
          <p className="text-sm">{status.msg}</p>
          <button onClick={() => setStatus(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="mt-4 card p-5">
          <h3 className="font-medium text-sm mb-3">{preview.fileName} — Preview</h3>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              ['Total', preview.parsed.length, '#7c6af7'],
              ['New', preview.newCount, '#2dd4a0'],
              ['Income', income, '#2dd4a0'],
              ['Expense', expense, '#f06080'],
            ].map(([label, val, color]) => (
              <div key={label} className="bg-white/[0.03] rounded-xl p-3 text-center">
                <div className="font-mono text-xl font-semibold" style={{ color }}>{val}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          {transfers > 0 && (
            <p className="text-xs text-white/40 mb-4">↔ {transfers} transfers auto-detected and excluded from totals.</p>
          )}
          <div className="flex gap-3">
            <button onClick={confirmImport} className="btn-primary">Import {preview.newCount} transactions</button>
            <button onClick={() => setPreview(null)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Stats */}
      {transactions.length > 0 && (
        <div className="mt-6 card p-5">
          <h3 className="text-sm font-medium text-white/60 mb-3">Current Data</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Transactions', transactions.length, '#7c6af7'],
              ['Uncategorized', transactions.filter(t => !t.isTransfer && !t.category).length, '#f0a040'],
              ['Transfers', transactions.filter(t => t.isTransfer).length, '#64748b'],
            ].map(([label, val, color]) => (
              <div key={label} className="bg-white/[0.03] rounded-xl p-3 text-center">
                <div className="font-mono text-xl font-semibold" style={{ color }}>{val}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
