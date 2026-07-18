import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  if (!user) return null;

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setError('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post('/chat', { message: text });
      setMessages((m) => [...m, { role: 'ai', text: res.data.reply }]);
    } catch (err) {
      setError(err.response?.data?.message || 'The desk could not be reached.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 font-body">
      {open && (
        <div className="mb-3 w-[22rem] sm:w-[26rem] h-[30rem] bg-ink-panel border border-ink-line rounded-sm shadow-2xl flex flex-col overflow-hidden animate-[fadeIn_0.15s_ease-out]">
          {/* Header, styled like a case-file tab */}
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-ink-line bg-ink">
            <div>
              <p className="font-display text-lg text-parchment leading-none">The Desk</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-parchment/40 mt-1">
                Ask about the program
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-parchment/40 hover:text-parchment text-lg leading-none transition"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="absolute bottom-0 left-5 right-5 h-px bg-stamp-amber/30" />
          </div>

          {/* Message ledger */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 paper-texture bg-ink">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <p className="font-display text-parchment/30 text-2xl mb-2">—</p>
                <p className="text-parchment/35 text-sm leading-relaxed">
                  No entries yet. Ask about attendance,<br />tasks, or program details.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-sm px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-parchment text-parchment-text'
                      : 'bg-ink-panel border border-ink-line text-parchment/90'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-ink-panel border border-ink-line text-parchment/40 rounded-sm px-3.5 py-2.5 text-sm font-mono tracking-wide">
                  processing…
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="px-5 py-2 text-xs font-mono text-stamp-red bg-stamp-red/10 border-t border-stamp-red/30">
              {error}
            </p>
          )}

          {/* Input row */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 p-4 border-t border-ink-line bg-ink">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write your query…"
              className="flex-1 bg-ink-panel border border-ink-line rounded-sm px-3.5 py-2.5 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:border-stamp-amber/60 transition"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-stamp-amber text-ink font-semibold rounded-sm px-4 py-2.5 text-sm uppercase tracking-wide disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Toggle — wax-seal style button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="stamp w-16 h-16 !rotate-0 bg-ink-panel text-stamp-amber shadow-xl hover:scale-105 transition-transform"
        style={{ color: '#C98A3E' }}
        aria-label="Toggle assistant"
      >
        {open ? '✕' : 'ASK'}
      </button>
    </div>
  );
}
