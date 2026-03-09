export const PALETTES = [
  {
    id: 'forest', name: 'Forest', swatch: '#2F6F5F',
    light: { primary: '#2F6F5F', hover: '#245a4c', accent: '#8EDB8E', accentLight: '#DFF3E6' },
    dark:  { primary: '#3BC57A', hover: '#30a566', accent: '#3BC57A', accentLight: 'rgba(59,197,122,0.12)' },
  },
  {
    id: 'ocean', name: 'Ocean', swatch: '#1A6FAF',
    light: { primary: '#1A6FAF', hover: '#155a91', accent: '#7ECBE8', accentLight: '#DFF0FA' },
    dark:  { primary: '#4AAEE0', hover: '#3a9dd0', accent: '#4AAEE0', accentLight: 'rgba(74,174,224,0.12)' },
  },
  {
    id: 'purple', name: 'Purple', swatch: '#6B4EBF',
    light: { primary: '#6B4EBF', hover: '#5840a0', accent: '#C3B1F0', accentLight: '#EDE8FB' },
    dark:  { primary: '#9B7EE8', hover: '#8a6cd8', accent: '#9B7EE8', accentLight: 'rgba(155,126,232,0.12)' },
  },
  {
    id: 'sunset', name: 'Sunset', swatch: '#C45429',
    light: { primary: '#C45429', hover: '#a84522', accent: '#F0B090', accentLight: '#FCE8DF' },
    dark:  { primary: '#E87D55', hover: '#d86a40', accent: '#E87D55', accentLight: 'rgba(232,125,85,0.12)' },
  },
  {
    id: 'rose', name: 'Rose', swatch: '#C43B6D',
    light: { primary: '#C43B6D', hover: '#a82f5a', accent: '#F0AABF', accentLight: '#FBDFE9' },
    dark:  { primary: '#E87DA0', hover: '#d86a8e', accent: '#E87DA0', accentLight: 'rgba(232,125,160,0.12)' },
  },
  {
    id: 'slate', name: 'Slate', swatch: '#3F5573',
    light: { primary: '#3F5573', hover: '#334560', accent: '#A8BECE', accentLight: '#DDE8F0' },
    dark:  { primary: '#7B9CC5', hover: '#6a8ab3', accent: '#7B9CC5', accentLight: 'rgba(123,156,197,0.12)' },
  },
  {
    id: 'teal', name: 'Teal', swatch: '#0E7A8C',
    light: { primary: '#0E7A8C', hover: '#0b6372', accent: '#7EE0E8', accentLight: '#DFF6F8' },
    dark:  { primary: '#3BC5CF', hover: '#30b3bd', accent: '#3BC5CF', accentLight: 'rgba(59,197,207,0.12)' },
  },
  {
    id: 'amber', name: 'Amber', swatch: '#B5720A',
    light: { primary: '#B5720A', hover: '#945d08', accent: '#F7D580', accentLight: '#FEF3D0' },
    dark:  { primary: '#F0A030', hover: '#e08e20', accent: '#F0A030', accentLight: 'rgba(240,160,48,0.12)' },
  },
]

export function applyPalette(paletteId, isDark) {
  const palette = PALETTES.find(p => p.id === paletteId) ?? PALETTES[0]
  const vars = isDark ? palette.dark : palette.light
  const el = document.documentElement
  el.style.setProperty('--primary',      vars.primary)
  el.style.setProperty('--primary-hover', vars.hover)
  el.style.setProperty('--accent',       vars.accent)
  el.style.setProperty('--accent-light', vars.accentLight)
}
