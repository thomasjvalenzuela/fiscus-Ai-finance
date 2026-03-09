import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Sparkles, Settings2, Wand2 } from 'lucide-react'
import { chatWithAdvisor } from '../lib/openai.js'

const QUICK_ACTIONS = [
  { label: 'Where am I overspending?', icon: '📊' },
  { label: 'Suggest ways to save $500/mo', icon: '💰' },
  { label: 'How\'s my debt payoff going?', icon: '📉' },
  { label: 'Give me a budget check-in', icon: '✅' },
]

export default function FloatingChat({ summary, debts, settings, onOpenWizard }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef()
  const abortRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const send = async (text = input) => {
    const msg = text.trim()
    if (!msg || loading) return
    if (!settings.openaiKey) { setError('Add your OpenAI API key in Settings.'); return }
    setError('')
    const userMsg = { role: 'user', content: msg }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    setStreaming('')
    abortRef.current = new AbortController()
    try {
      const reply = await chatWithAdvisor(
        history, summary, debts, [],
        settings.openaiKey, settings.openaiModel,
        (partial) => setStreaming(partial),
        abortRef.current.signal,
      )
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
      setStreaming('')
    }
  }

  const hasKey = !!settings.openaiKey

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 ${
          open ? 'bg-white/10 rotate-90' : 'bg-accent hover:bg-accent/90 hover:scale-105'
        }`}
        style={{ boxShadow: open ? 'none' : '0 8px 32px rgba(124,106,247,0.5)' }}
      >
        {open ? <X size={20} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08]"
          style={{ height: '520px', background: '#13131c' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0" style={{ background: '#0f0f18' }}>
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">Fiscus Assistant</div>
              <div className="text-[11px] text-white/35">Powered by {settings.openaiModel || 'GPT-4o mini'}</div>
            </div>
            <button
              onClick={onOpenWizard}
              title="Open setup wizard"
              className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-accent transition-colors"
            >
              <Wand2 size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-white/30 text-center pt-1">
                  {hasKey ? 'Ask anything about your finances, or try a quick action:' : 'Set up your OpenAI key to get started.'}
                </p>

                {!hasKey && (
                  <button
                    onClick={onOpenWizard}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors text-left"
                  >
                    <Wand2 size={16} className="text-accent shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-accent">Run Setup Wizard</div>
                      <div className="text-xs text-white/40 mt-0.5">Configure API key, rental properties & budget</div>
                    </div>
                  </button>
                )}

                {hasKey && QUICK_ACTIONS.map(({ label, icon }) => (
                  <button
                    key={label}
                    onClick={() => send(label)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.05] transition-colors text-left"
                  >
                    <span className="text-base shrink-0">{icon}</span>
                    <span className="text-xs text-white/70">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-accent" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-accent text-white rounded-tr-sm'
                    : 'bg-white/[0.07] text-white/85 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                    <User size={11} className="text-white/50" />
                  </div>
                )}
              </div>
            ))}

            {streaming && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={12} className="text-accent" />
                </div>
                <div className="max-w-[85%] rounded-xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap bg-white/[0.07] text-white/85">
                  {streaming}<span className="animate-pulse">▍</span>
                </div>
              </div>
            )}

            {error && <p className="text-[11px] text-[#f06080] text-center">{error}</p>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.06] p-3 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="input flex-1 text-xs py-2"
                placeholder={hasKey ? 'Ask about your finances…' : 'Run setup wizard to get started →'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                disabled={!hasKey || loading}
              />
              {loading
                ? <button onClick={() => abortRef.current?.abort()} className="px-2 py-1 rounded-lg text-[#f06080] text-xs border border-[#f06080]/20 shrink-0">Stop</button>
                : <button onClick={() => send()} disabled={!hasKey || !input.trim()} className="w-8 h-8 rounded-lg bg-accent disabled:opacity-30 flex items-center justify-center shrink-0 transition-opacity">
                    <Send size={13} className="text-white" />
                  </button>
              }
            </div>
          </div>
        </div>
      )}
    </>
  )
}
