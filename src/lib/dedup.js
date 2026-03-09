/**
 * Deduplicates transactions by import_hash_v2, then flags same date+amount pairs
 * across different accounts as possible duplicates.
 */
export function deduplicateByHash(incoming, existing) {
  const existingHashes = new Set(existing.map(t => t.import_hash_v2).filter(Boolean))
  return incoming.filter(t => !t.import_hash_v2 || !existingHashes.has(t.import_hash_v2))
}

export function findPossibleDuplicates(transactions) {
  const seen = {}
  const pairs = []
  for (const t of transactions) {
    const key = `${t.date?.substring(0, 10)}|${Math.abs(parseFloat(t.amount || 0)).toFixed(2)}`
    if (seen[key] && seen[key].source_name !== t.source_name) {
      pairs.push([seen[key], t])
    } else {
      seen[key] = t
    }
  }
  return pairs
}
