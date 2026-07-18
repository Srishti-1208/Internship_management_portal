import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/attendance');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign in. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-[0.95fr_1.05fr] bg-ink-panel rounded-sm overflow-hidden shadow-2xl">
        {/* Decorative seal panel */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-parchment relative ledger-rule">
          <div className="absolute inset-3 border border-stamp-amber/30 pointer-events-none" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-stamp-amber">
              Internship Management Portal
            </p>
            <svg viewBox="0 0 120 120" className="w-32 h-32 my-10">
              <circle cx="60" cy="60" r="52" stroke="#B88D3F" strokeWidth="1.2" opacity="0.55" fill="none" />
              <circle cx="60" cy="60" r="44" stroke="#B88D3F" strokeWidth="1.2" fill="none" />
              <path
                d="M60 24 C68 40 76 44 92 48 C76 52 68 56 60 72 C52 56 44 52 28 48 C44 44 52 40 60 24 Z"
                fill="#B88D3F"
                opacity="0.9"
              />
              <text x="60" y="98" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="7" letterSpacing="2" fill="#B88D3F">
                EST · PROGRAM
              </text>
            </svg>
            <p className="font-display italic text-2xl leading-snug text-parchment-text max-w-xs">
              Every entry logged.<br />
              Every hour <span className="not-italic text-stamp-amber">earned.</span><br />
              Every certificate <span className="not-italic text-stamp-amber">true.</span>
            </p>
          </div>
          <div className="flex justify-between font-mono text-[11px] tracking-wide text-parchment-text/45 border-t border-parchment-text/10 pt-4">
            <span>Vol. II</span>
            <span>Ledger of Record</span>
          </div>
        </div>

        {/* Form panel */}
        <div className="p-10 sm:p-14 flex flex-col justify-center">
          <h1 className="font-display text-3xl text-parchment mb-1.5">Welcome back</h1>
          <p className="text-parchment/50 text-sm mb-8">Sign in to continue to your dossier.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.14em] text-parchment/45 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-ink-line pb-2.5 text-parchment placeholder:text-parchment/30 focus:outline-none focus:border-parchment transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.14em] text-parchment/45 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-ink-line pb-2.5 text-parchment placeholder:text-parchment/30 focus:outline-none focus:border-parchment transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-parchment text-parchment-text font-semibold rounded-sm py-3.5 mt-2 hover:bg-parchment-dim transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
              <span className="w-4 h-px bg-stamp-amber" />
            </button>
          </form>

          <p className="text-center text-sm text-parchment/45 mt-7">
            New here?{' '}
            <Link to="/register" className="text-parchment font-semibold border-b border-stamp-amber">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}