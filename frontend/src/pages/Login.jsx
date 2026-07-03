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
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="inline-flex w-12 h-12 rounded-full border-2 border-stamp-amber text-stamp-amber items-center justify-center font-mono text-sm -rotate-6 mb-4">
            IP
          </span>
          <h1 className="font-display text-3xl text-parchment">Sign in to Ledger</h1>
          <p className="text-parchment/50 text-sm mt-1.5">The internship program's daily record.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-ink-panel border border-ink-line rounded-xl p-7 space-y-4">
          {error && (
            <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-parchment text-parchment-text font-semibold rounded-md py-2.5 hover:bg-parchment-dim transition-colors disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-parchment/45 mt-5">
          New here?{' '}
          <Link to="/register" className="text-stamp-amber hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
