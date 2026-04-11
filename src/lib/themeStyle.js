/**
 * Manages the "theme style" preference — currently "default" or "circle".
 * Stored in localStorage under a device-level key (not per-user).
 */

const LS_KEY = 'fiscus_theme_style'
export const THEME_STYLES = ['default', 'circle']

export function getThemeStyle() {
  return localStorage.getItem(LS_KEY) ?? 'default'
}

export function setThemeStyle(style) {
  localStorage.setItem(LS_KEY, style)
  applyThemeStyle(style)
}

export function applyThemeStyle(style) {
  if (style === 'circle') {
    document.documentElement.setAttribute('data-theme', 'circle')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}
