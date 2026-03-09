const TRANSFER_PATTERNS = [
  'ONLINE PAYMENT THANK YOU',
  'APPLECARD GSBANK PAYMENT',
  'CAPITAL ONE MOBILE PYMT',
  'CAPITAL ONE PAYMENT',
  'PAYPAL INST XFER',
  'ONLINE TRANSFER TO WELLS FARGO',
  'ONLINE TRANSFER REF #',
  'ACH DEPOSIT INTERNET TRANSFER',
]

export function isTransfer(description = '') {
  const upper = description.toUpperCase()
  return TRANSFER_PATTERNS.some(p => upper.includes(p))
}

export function extractKeyword(desc = '') {
  let s = desc
    .replace(/PURCHASE AUTHORIZED ON \d+\/\d+\s*/gi, '')
    .replace(/RECURRING PAYMENT AUTHORIZED ON \d+\/\d+\s*/gi, '')
    .replace(/RECURRING PAYMENT\s*/gi, '')
    .replace(/REF #\S+/gi, '')
    .replace(/\b\d{6,}\b/g, '')
    .replace(/CARD \d+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  const loc = s.search(/\b\d+\s+[A-Z]+ (AVE|ST|RD|DR|BLVD|LN|WAY|HWY)/i)
  if (loc > 5) s = s.substring(0, loc).trim()
  s = s.replace(/\s+[A-Z]{2,}\s+[A-Z]{2}\s*$/, '').trim()
  s = s.replace(/(AMAZON\s+MKTPL?\S*)/i, 'AMAZON MKTPL').trim()
  return s.substring(0, 50)
}
