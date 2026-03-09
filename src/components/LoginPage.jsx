import { useState } from 'react'
import { Eye, EyeOff, Loader, Zap } from 'lucide-react'
import { loginUser, registerUser, loginAsDemo } from '../lib/authStore.js'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let session
      if (mode === 'login') {
        session = await loginUser(username, password)
      } else {
        await registerUser(username, password)
        session = await loginUser(username, password)
      }
      onLogin(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    try {
      const session = await loginAsDemo()
      onLogin(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--accent-light)' }}>
            <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>$</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Fiscus</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your personal finance dashboard</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--bg)' }}>
            {[['login', 'Sign In'], ['register', 'Create Account']].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => { setMode(id); setError('') }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={mode === id
                  ? { background: 'var(--bg-card)', color: 'var(--primary)', boxShadow: 'var(--shadow)' }
                  : { color: 'var(--text-muted)' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input
                className="input"
                type="text"
                placeholder="your-username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete={mode === 'login' ? 'username' : 'new-password'}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,107,107,0.1)', color: 'var(--danger)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || !username || !password} className="btn-primary w-full justify-center py-2.5">
              {loading ? <Loader size={15} className="animate-spin" /> : mode === 'login' ? 'Sign In' : 'Create Account & Sign In'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              No account?{' '}
              <button type="button" onClick={() => setMode('register')} className="font-medium" style={{ color: 'var(--primary)' }}>
                Create one
              </button>
            </p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Demo login */}
          <button
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all disabled:opacity-40"
            style={{
              border:     '1px dashed var(--border)',
              color:      'var(--text-muted)',
              background: 'transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.color       = 'var(--primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color       = 'var(--text-muted)'
            }}
          >
            <Zap size={14} />
            Try Demo (no sign-in required)
          </button>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          All data stays on your device — nothing is sent to any server.
        </p>
      </div>
    </div>
  )
}
