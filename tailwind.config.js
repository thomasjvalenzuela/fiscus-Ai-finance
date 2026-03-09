/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:   'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        accent:    'var(--accent)',
        'accent-light': 'var(--accent-light)',
        bg:        'var(--bg)',
        'bg-card': 'var(--bg-card)',
        'bg-sidebar': 'var(--bg-sidebar)',
        border:    'var(--border)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
        info:    'var(--info)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow)',
        md:   'var(--shadow-md)',
      },
      borderRadius: {
        card: '16px',
        hero: '18px',
      },
    },
  },
  plugins: [],
}
