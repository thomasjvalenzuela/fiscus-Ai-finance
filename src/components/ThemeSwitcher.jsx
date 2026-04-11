import { useState, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import { getThemeStyle, setThemeStyle } from '../lib/themeStyle.js'

/**
 * Floating pill in the bottom-right corner for quick theme-style toggling.
 * Visible on all authenticated pages.
 */
export function ThemeSwitcherPill() {
  const [style, setStyle] = useState(() => getThemeStyle())

  const toggle = useCallback(() => {
    const next = style === 'default' ? 'circle' : 'default'
    setThemeStyle(next)
    setStyle(next)
  }, [style])

  return (
    <button
      onClick={toggle}
      title={style === 'circle' ? 'Switch to Default theme' : 'Switch to Circle theme'}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-xs font-semibold transition-all"
      style={{
        background: style === 'circle' ? '#29b6d4' : 'var(--primary)',
        color: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      <Sparkles size={12} />
      {style === 'circle' ? 'Default' : 'Circle'}
    </button>
  )
}

/**
 * Card-style theme-style selector for Settings > Appearance.
 */
export function ThemeStylePicker() {
  const [style, setStyle] = useState(() => getThemeStyle())

  const select = useCallback((s) => {
    setThemeStyle(s)
    setStyle(s)
  }, [])

  const options = [
    {
      id: 'default',
      label: 'Default',
      description: 'Clean light/dark mode with palette customization.',
      preview: ['#2F6F5F', '#F5F7F6', '#FFFFFF'],
    },
    {
      id: 'circle',
      label: 'Circle',
      description: 'Dark navy aesthetic with teal accents and rounder cards.',
      preview: ['#29b6d4', '#0d1b2a', '#1a2e44'],
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => select(opt.id)}
          className="text-left p-4 rounded-xl border transition-all"
          style={{
            borderColor: style === opt.id ? 'var(--primary)' : 'var(--border)',
            background: style === opt.id ? 'var(--accent-light)' : 'var(--bg)',
            outline: style === opt.id ? '2px solid var(--primary)' : 'none',
            outlineOffset: 2,
          }}
        >
          {/* Colour swatch row */}
          <div className="flex gap-1.5 mb-3">
            {opt.preview.map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full"
                style={{ background: color, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
              />
            ))}
          </div>
          <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
            {opt.label}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {opt.description}
          </div>
        </button>
      ))}
    </div>
  )
}
