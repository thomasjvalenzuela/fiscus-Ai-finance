import { useState, useRef, useEffect } from 'react'
import { chatWithAdvisor } from '../lib/openai.js'
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react'
import { useSettingsStore } from '../stores/useSettingsStore.js'

const QUICK = [
  'Where am I overspending?',
  'How can I reduce monthly expenses?',
  'What\'s my biggest financial risk?',
  'Give me a debt payoff strategy',
  'How much could I save this year?',
]

export default function AIAdvisor({ summary, debts, settings }) {
  const { getChatHistory, saveChatHistory, clearChatHistory } = useSettingsStore()
  const [messages, setMessages] = useState(() => getChatHistory())
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [streaming, setStreaming] = useState('')
  const [error, setError]       = useState('')
  const bottomRef = useRef()
  const abortRef  = useRef()

  // Save whenever messages change
  useEffect(() => {
    saveChatHistory(messages)
  }, [messages, saveChatHistory])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const send = async (text = input) => {
    if (!text.trim() || loading) return
    if (!settings.openaiKey) { setError('Add your OpenAI API key in Settings first.'); return }
    setError('')
    const userMsg = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    setStreaming('')
    abortRef.current = new AbortController()
    try {
      const reply = await chatWithAdvisor(
        history,
        summary,
        debts,
        [],
        settings.openaiKey,
        settings.openaiModel,
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

  const newChat = () => {
    abortRef.current?.abort()
    setMessages([])
    setStreaming('')
    setError('')
    clearChatHistory()
  }

  const hasKey = !!settings.openaiKey

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Bot size={16} style={{ color: 'var(--primary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Financial Advisor</span>
          {messages.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--accent-light)', color: 'var(--primary)' }}
            >
              {messages.filter(m => m.role === 'user').length} messages
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={newChat}
            className="flex items-center gap-1.5 text-xs btn-ghost py-1"
            title="Start a new chat"
          >
            <Trash2 size={12} /> New Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-light)' }}
            >
              <Bot size={28} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                AI Financial Advisor
              </h3>
              <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
                Ask anything about your spending, savings, or debt. I have full context of your financial data.
              </p>
            </div>
            {hasKey && (
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {QUICK.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={{
                      background: 'var(--bg)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {!hasKey && (
              <p
                className="text-sm rounded-xl px-4 py-2"
                style={{ color: 'var(--warning)', background: 'rgba(247,183,49,0.1)', border: '1px solid rgba(247,183,49,0.2)' }}
              >
                Add your OpenAI API key in Settings to enable AI chat.
              </p>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'var(--accent-light)' }}
              >
                <Bot size={14} style={{ color: 'var(--primary)' }} />
              </div>
            )}
            <div
              className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
              style={m.role === 'user'
                ? { background: 'var(--primary)', color: 'white', borderBottomRightRadius: 4 }
                : { background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }
              }
            >
              {m.content}
            </div>
            {m.role === 'user' && (
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <User size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            )}
          </div>
        ))}

        {streaming && (
          <div className="flex gap-3">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'var(--accent-light)' }}
            >
              <Bot size={14} style={{ color: 'var(--primary)' }} />
            </div>
            <div
              className="max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {streaming}<span className="animate-pulse">▍</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder={hasKey ? 'Ask about your finances…' : 'Add OpenAI key in Settings…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={!hasKey || loading}
          />
          {loading
            ? (
              <button
                onClick={() => abortRef.current?.abort()}
                className="btn-ghost shrink-0"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                Stop
              </button>
            )
            : (
              <button
                onClick={() => send()}
                disabled={!hasKey || !input.trim()}
                className="btn-primary shrink-0 flex items-center gap-2 disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            )
          }
        </div>
      </div>
    </div>
  )
}
