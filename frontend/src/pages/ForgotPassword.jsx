import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md bg-ink-panel rounded-sm p-10 sm:p-14 shadow-2xl">
        <h1 className="font-display text-3xl text-parchment mb-1.5">Reset your password</h1>
        <p className="text-parchment/50 text-sm mb-8">
          Enter your account email and we'll send you a link to choose a new password.
        </p>

        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-stamp-green bg-stamp-green/10 border border-stamp-green/30 rounded-md px-3 py-2">
              {result.message}
            </p>
            {result.devResetLink && (
              <div className="text-xs font-mono text-parchment/60 bg-ink border border-ink-line rounded-md px-3 py-2 break-all">
                Dev mode — no email service configured, use this link directly:{' '}
                <a href={result.devResetLink} className="text-stamp-amber underline">
                  {result.devResetLink}
                </a>
              </div>
            )}
            <Link to="/login" className="inline-block text-sm text-parchment font-semibold border-b border-stamp-amber">
              ← Back to sign in
            </Link>
          </div>
        ) : (
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
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-parchment text-parchment-text font-semibold rounded-sm py-3.5 mt-2 hover:bg-parchment-dim transition-colors disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="text-center text-sm text-parchment/45">
              <Link to="/login" className="text-parchment font-semibold border-b border-stamp-amber">
                ← Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}