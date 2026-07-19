import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md bg-ink-panel rounded-sm p-10 sm:p-14 shadow-2xl">
        <h1 className="font-display text-3xl text-parchment mb-1.5">Choose a new password</h1>
        <p className="text-parchment/50 text-sm mb-8">Make it something you'll remember.</p>

        {done ? (
          <p className="text-sm text-stamp-green bg-stamp-green/10 border border-stamp-green/30 rounded-md px-3 py-2">
            Password updated. Redirecting you to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.14em] text-parchment/45 mb-2">
                New password
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
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.14em] text-parchment/45 mb-2">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-transparent border-b border-ink-line pb-2.5 text-parchment placeholder:text-parchment/30 focus:outline-none focus:border-parchment transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-parchment text-parchment-text font-semibold rounded-sm py-3.5 mt-2 hover:bg-parchment-dim transition-colors disabled:opacity-60"
            >
              {submitting ? 'Updating…' : 'Update password'}
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