import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Rotating CTA copy shown in the launcher tooltip
const TOOLTIP_MESSAGES = [
  { emoji: '👋', title: 'Hi! Need help?', subtitle: 'Ask about tasks, certificates, attendance & more.' },
  { emoji: '🤖', title: 'Ask our AI Assistant', subtitle: 'Get instant answers about your internship.' },
  { emoji: '💬', title: 'Need help with your internship?', subtitle: 'Ask anything about tasks, certificates, attendance, or applications.' },
];

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  // --- Launcher tooltip + attention-pulse state ---
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipMsg, setTooltipMsg] = useState(TOOLTIP_MESSAGES[0]);
  const [pulseActive, setPulseActive] = useState(false);
  const tooltipIndexRef = useRef(0);
  const autoHideTimer = useRef(null);
  const openRef = useRef(open);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Keep a ref of `open` so timers/intervals always read the latest value
  // without needing to be re-created every time the panel toggles.
  useEffect(() => {
    openRef.current = open;
    if (open) setTooltipVisible(false);
  }, [open]);

  // Shows the tooltip with the next rotating message, then auto-hides it
  // after 7s. Reused for both the on-load reveal and the hover trigger.
  const triggerTooltip = () => {
    if (openRef.current) return;
    setTooltipMsg(TOOLTIP_MESSAGES[tooltipIndexRef.current % TOOLTIP_MESSAGES.length]);
    tooltipIndexRef.current += 1;
    setTooltipVisible(true);
    clearTimeout(autoHideTimer.current);
    autoHideTimer.current = setTimeout(() => setTooltipVisible(false), 7000); // visible 7s
  };

  // On-load reveal (slight delay so it doesn't fire before paint) +
  // a subtle attention pulse on the launcher every ~13s.
  //
  // IMPORTANT: this only starts once `user` is actually loaded. Before that,
  // the component returns null (invisible) — if the timer started anyway,
  // the 900ms show + 7s auto-hide could both fire while nothing is on
  // screen, and by the time the widget finally mounts visibly, the tooltip
  // would already be "used up" and never appear on load (only via hover).
  useEffect(() => {
    if (!user) return;
    const initialTimer = setTimeout(triggerTooltip, 900);
    const pulseInterval = setInterval(() => {
      if (openRef.current) return;
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 1600);
    }, 13000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(pulseInterval);
      clearTimeout(autoHideTimer.current);
    };
  }, [user]);

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
      <div className="relative">
        {/* Elegant CTA tooltip bubble — fades/slides in on load, on hover,
           and auto-hides after ~7s. Always mounted so the fade transition
           runs both ways instead of popping in/out. */}
        <div
          role="status"
          className={`absolute bottom-full right-0 mb-4 w-64 sm:w-72 origin-bottom-right transition-all duration-500 ease-out ${
            tooltipVisible && !open
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="relative bg-parchment text-parchment-text rounded-2xl shadow-2xl border border-stamp-amber/30 px-4 py-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTooltipVisible(false);
                clearTimeout(autoHideTimer.current);
              }}
              className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center text-parchment-text/40 hover:text-parchment-text text-xs leading-none transition"
              aria-label="Dismiss tip"
            >
              ✕
            </button>
            <p className="text-sm font-semibold leading-snug pr-4">
              <span className="mr-1">{tooltipMsg.emoji}</span>
              {tooltipMsg.title}
            </p>
            <p className="text-xs text-parchment-text/70 mt-1 leading-relaxed pr-2">
              {tooltipMsg.subtitle}
            </p>
            {/* Pointer toward the chatbot icon */}
            <span className="absolute -bottom-1.5 right-6 w-3 h-3 bg-parchment border-r border-b border-stamp-amber/30 rotate-45" />
          </div>
        </div>

        {/* Periodic attention pulse — brief expanding ring every ~13s,
           suppressed while the panel is open or the tooltip is showing. */}
        {!open && pulseActive && (
          <span className="absolute inset-0 rounded-full border-2 border-stamp-amber animate-ping pointer-events-none" />
        )}

        <button
          onClick={() => {
            setOpen((o) => !o);
            setTooltipVisible(false);
            clearTimeout(autoHideTimer.current);
          }}
          onMouseEnter={triggerTooltip}
          onFocus={triggerTooltip}
          className="relative stamp w-16 h-16 !rotate-0 bg-ink-panel text-stamp-amber shadow-xl hover:scale-105 transition-transform flex items-center justify-center"
          style={{ color: '#C98A3E' }}
          aria-label="Toggle assistant"
        >
          {open ? (
            <span className="text-xl leading-none">✕</span>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          )}
          {!open && messages.length === 0 && (
            <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-stamp-green border-2 border-ink-panel">
              <span className="absolute inset-0 rounded-full bg-stamp-green animate-ping opacity-75" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}